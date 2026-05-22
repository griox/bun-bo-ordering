using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Queries;

public record UnreadOrderDto(
    Guid Id,
    string TableCode,
    string TableName,
    decimal TotalAmount,
    string PaymentMethod,
    OrderStatus Status,
    DateTime CreatedAt,
    List<UnreadOrderItemDto> Items
);

public record UnreadOrderItemDto(
    string ProductName,
    int Quantity
);

public record GetUnreadOrdersQuery() : IRequest<List<UnreadOrderDto>>;

public class GetUnreadOrdersQueryHandler : IRequestHandler<GetUnreadOrdersQuery, List<UnreadOrderDto>>
{
    private readonly IAppDbContext _context;

    public GetUnreadOrdersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UnreadOrderDto>> Handle(GetUnreadOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.TableSession)
            .ThenInclude(ts => ts!.Table)
            .Include(o => o.OrderItems)
            .Where(o => o.Status == OrderStatus.Processing || o.Status == OrderStatus.Paid)
            .OrderByDescending(o => o.CreatedAt)
            .AsNoTracking()
            .Select(o => new UnreadOrderDto(
                o.Id,
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.TableCode : "N/A",
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.Name : "N/A",
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt,
                o.OrderItems.Select(i => new UnreadOrderItemDto(i.ProductName, i.Quantity)).ToList()
            ))
            .ToListAsync(cancellationToken);

        return orders;
    }
}
