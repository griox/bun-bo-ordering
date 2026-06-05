using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Queries;

public record PagedResult<T>(List<T> Items, int TotalCount, int Skip, int Take);

/// <summary>
/// Query to retrieve a paginated, filtered list of orders.
/// Optimized: COUNT runs on the base table without JOIN to avoid full-table scan cost.
/// </summary>
public record GetAllOrdersQuery(
    int Skip = 0,
    int Take = 20,
    OrderStatus? Status = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Keyword = null,
    string? PaymentMethod = null
) : IRequest<PagedResult<OrderSummaryDto>>;

public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, PagedResult<OrderSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetAllOrdersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<OrderSummaryDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        // --- Optimization #1: COUNT on base table only (no JOIN) ---
        // EF Core translates Include() into a LEFT JOIN even for CountAsync().
        // We build a lightweight count query on Orders alone to avoid the join cost
        // when the table has 10k+ rows from load testing.
        var countQuery = _context.Orders.AsQueryable();

        if (request.Status.HasValue)
            countQuery = countQuery.Where(o => o.Status == request.Status.Value);

        if (!string.IsNullOrEmpty(request.PaymentMethod) && request.PaymentMethod != "All")
            countQuery = countQuery.Where(o => o.PaymentMethod == request.PaymentMethod);

        if (request.FromDate.HasValue)
            countQuery = countQuery.Where(o => o.CreatedAt >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            countQuery = countQuery.Where(o => o.CreatedAt <= request.ToDate.Value);

        var totalCount = await countQuery.CountAsync(cancellationToken);

        // --- Data query: JOIN only for the small page window (Skip+Take rows) ---
        var dataQuery = _context.Orders
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .AsQueryable();

        if (request.Status.HasValue)
            dataQuery = dataQuery.Where(o => o.Status == request.Status.Value);

        if (!string.IsNullOrEmpty(request.PaymentMethod) && request.PaymentMethod != "All")
            dataQuery = dataQuery.Where(o => o.PaymentMethod == request.PaymentMethod);

        if (request.FromDate.HasValue)
            dataQuery = dataQuery.Where(o => o.CreatedAt >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            dataQuery = dataQuery.Where(o => o.CreatedAt <= request.ToDate.Value);

        // Optimization #2: keyword search on table code (resolved after JOIN)
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var kw = request.Keyword.Trim().ToLower();
            dataQuery = dataQuery.Where(o =>
                o.Id.ToString().ToLower().Contains(kw) ||
                (o.TableSession != null && o.TableSession.Table != null &&
                 o.TableSession.Table.TableCode.ToLower().Contains(kw)));
        }

        var orders = await dataQuery
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.TableCode : "N/A",
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.Name : "Unknown Table",
                o.CreatedAt,
                o.TotalAmount,
                o.Status,
                o.Note,
                o.PaymentMethod
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderSummaryDto>(orders, totalCount, request.Skip, request.Take);
    }
}

