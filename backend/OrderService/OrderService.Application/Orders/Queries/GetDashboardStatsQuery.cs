using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;
using System.Globalization;

namespace OrderService.Application.Orders.Queries;

public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IAppDbContext _context;

    public GetDashboardStatsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysAgo = today.AddDays(-6);

        // 1. Daily Revenue
        var dailyRevenue = await _context.Orders
            .Where(o => o.CreatedAt >= today && o.Status == OrderStatus.Paid)
            .SumAsync(o => o.TotalAmount, cancellationToken);

        // 2. Total Orders Today
        var totalOrdersToday = await _context.Orders
            .Where(o => o.CreatedAt >= today)
            .CountAsync(cancellationToken);

        // 3. New Customers Today (Unique CustomerId)
        var newCustomersToday = await _context.Orders
            .Where(o => o.CreatedAt >= today && o.CustomerId != null)
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

        return new DashboardStatsDto(
            dailyRevenue,
            totalOrdersToday,
            newCustomersToday,
            bestSellingItem,
            chartData
        );
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
