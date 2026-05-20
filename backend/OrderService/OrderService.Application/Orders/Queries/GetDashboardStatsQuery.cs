using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;
using System.Globalization;

namespace OrderService.Application.Orders.Queries;

public record GetDashboardStatsQuery(bool ForceRefresh = false) : IRequest<DashboardStatsDto>;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IAppDbContext _context;
    private readonly ICacheService _cache;
    private const string CacheKey = "dashboard_stats";
    // Mutex: chỉ 1 request rebuild cache tại một thời điểm (chống thundering herd)
    private static readonly SemaphoreSlim _semaphore = new(1, 1);

    public GetDashboardStatsQueryHandler(IAppDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        if (!request.ForceRefresh)
        {
            // Fast path: return cached data immediately
            var cachedData = await _cache.GetAsync<DashboardStatsDto>(CacheKey);
            if (cachedData != null)
            {
                return cachedData;
            }
        }

        // Slow path: acquire lock, double-check, then rebuild
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            if (!request.ForceRefresh)
            {
                // Re-check inside lock (another request may have rebuilt cache while we waited)
                var cachedData = await _cache.GetAsync<DashboardStatsDto>(CacheKey);
                if (cachedData != null)
                {
                    return cachedData;
                }
            }

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);
            var sevenDaysAgo = today.AddDays(-6);
            var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // 1. Daily Revenue
            var dailyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= today && o.Status == OrderStatus.Paid)
                .SumAsync(o => o.TotalAmount, cancellationToken);

            // 1b. Yesterday Revenue (for trend comparison)
            var yesterdayRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= yesterday && o.CreatedAt < today && o.Status == OrderStatus.Paid)
                .SumAsync(o => o.TotalAmount, cancellationToken);

            // 2. Total Orders Today
            var totalOrdersToday = await _context.Orders
                .Where(o => o.CreatedAt >= today)
                .CountAsync(cancellationToken);

            // 2b. Total Orders Yesterday
            var totalOrdersYesterday = await _context.Orders
                .Where(o => o.CreatedAt >= yesterday && o.CreatedAt < today)
                .CountAsync(cancellationToken);

            // 3. New Customers Today (Unique CustomerId)
            var newCustomersToday = await _context.Orders
                .Where(o => o.CreatedAt >= today && o.CustomerId != null)
                .Select(o => o.CustomerId)
                .Distinct()
                .CountAsync(cancellationToken);

            // 3b. New Customers Yesterday
            var newCustomersYesterday = await _context.Orders
                .Where(o => o.CreatedAt >= yesterday && o.CreatedAt < today && o.CustomerId != null)
                .Select(o => o.CustomerId)
                .Distinct()
                .CountAsync(cancellationToken);

            // Monthly aggregates
            var monthlyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= monthStart && o.Status == OrderStatus.Paid)
                .SumAsync(o => o.TotalAmount, cancellationToken);

            var totalOrdersMonth = await _context.Orders
                .Where(o => o.CreatedAt >= monthStart)
                .CountAsync(cancellationToken);

            var totalCustomersMonth = await _context.Orders
                .Where(o => o.CreatedAt >= monthStart && o.CustomerId != null)
                .Select(o => o.CustomerId)
                .Distinct()
                .CountAsync(cancellationToken);

            // 4. Best Selling Item
            var bestSellingItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order!.CreatedAt >= today.AddDays(-30) && oi.Order!.Status == OrderStatus.Paid)
                .GroupBy(oi => oi.ProductName)
                .OrderByDescending(g => g.Sum(x => x.Quantity))
                .Select(g => g.Key)
                .FirstOrDefaultAsync(cancellationToken) ?? "N/A";

            // 5. Weekly Revenue Chart
            var weeklyData = await _context.Orders
                .Where(o => o.CreatedAt >= sevenDaysAgo && o.Status == OrderStatus.Paid)
                .ToListAsync(cancellationToken);

            var chartData = new List<RevenueChartDataDto>();
            for (int i = 0; i < 7; i++)
            {
                var date = sevenDaysAgo.AddDays(i);
                var revenue = weeklyData
                    .Where(o => o.CreatedAt.Date == date)
                    .Sum(o => o.TotalAmount);

                chartData.Add(new RevenueChartDataDto(
                    date.ToString("dd/MM"),
                    GetVietnameseDayOfWeek(date),
                    revenue
                ));
            }

            // 6. Recent Orders (Top 10, prioritize paid orders)
            var recentOrders = await _context.Orders
                .Include(o => o.TableSession)
                    .ThenInclude(ts => ts!.Table)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => new OrderSummaryDto(
                    o.Id,
                    o.TableSession!.Table!.TableCode,
                    o.TableSession!.Table!.Name,
                    o.CreatedAt,
                    o.TotalAmount,
                    o.Status,
                    o.Note
                ))
                .ToListAsync(cancellationToken);

            var result = new DashboardStatsDto(
                dailyRevenue,
                totalOrdersToday,
                newCustomersToday,
                bestSellingItem,
                chartData,
                recentOrders,
                yesterdayRevenue,
                totalOrdersYesterday,
                newCustomersYesterday,
                monthlyRevenue,
                totalOrdersMonth,
                totalCustomersMonth
            );

            // Cache for 1 hour. The DashboardCacheWorker will refresh it every 4 minutes.
            // This guarantees the API endpoint never queries the DB under high load.
            await _cache.SetAsync(CacheKey, result, TimeSpan.FromHours(1));

            return result;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private string GetVietnameseDayOfWeek(DateTime date)
    {
        return date.DayOfWeek switch
        {
            DayOfWeek.Monday => "Thứ 2",
            DayOfWeek.Tuesday => "Thứ 3",
            DayOfWeek.Wednesday => "Thứ 4",
            DayOfWeek.Thursday => "Thứ 5",
            DayOfWeek.Friday => "Thứ 6",
            DayOfWeek.Saturday => "Thứ 7",
            DayOfWeek.Sunday => "Chủ Nhật",
            _ => ""
        };
    }
}
