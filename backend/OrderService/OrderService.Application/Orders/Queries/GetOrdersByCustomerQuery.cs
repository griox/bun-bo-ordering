using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Application.Dtos;

namespace OrderService.Application.Orders.Queries;

/// <summary>
/// Returns a paginated summary list of a customer's orders.
/// OrderItems are intentionally NOT included — they are fetched on-demand
/// when the admin opens the individual order detail modal.
/// This avoids loading 10k+ orders × N items into memory at once.
/// </summary>
public record GetOrdersByCustomerQuery(
    Guid CustomerId,
    int Skip = 0,
    int Take = 20
) : IRequest<PagedResult<OrderSummaryDto>>;

public class GetOrdersByCustomerQueryHandler : IRequestHandler<GetOrdersByCustomerQuery, PagedResult<OrderSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetOrdersByCustomerQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<OrderSummaryDto>> Handle(GetOrdersByCustomerQuery request, CancellationToken cancellationToken)
    {
        // COUNT on lightweight base query — no JOIN needed
        var totalCount = await _context.Orders
            .Where(o => o.CustomerId == request.CustomerId)
            .CountAsync(cancellationToken);

        // Data page: JOIN only for the small window, no OrderItems
        var orders = await _context.Orders
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .Where(o => o.CustomerId == request.CustomerId)
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.TableCode : "N/A",
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.Name : "Mang đi",
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
