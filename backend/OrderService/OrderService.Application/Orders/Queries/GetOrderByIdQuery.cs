using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Orders.Queries;

public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDetailDto?>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    private readonly IAppDbContext _context;

    public GetOrderByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDetailDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order is null) return null;

        return new OrderDetailDto
        {
            Id = order.Id,
            TableSessionId = order.TableSessionId,
            TotalAmount = order.TotalAmount,
            Status = order.Status.ToString(),
            Note = order.Note,
            CreatedAt = order.CreatedAt,
            TableCode = order.TableSession?.Table?.TableCode ?? "N/A",
            TableName = order.TableSession?.Table?.Name ?? "Unknown Table",
            OrderItems = order.OrderItems.Select(item => new OrderItemDto
            {
                Id = item.Id,
                FoodId = item.FoodId,
                ProductName = item.ProductName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.TotalPrice,
                Note = item.Note
            }).ToList()
        };
    }
}
