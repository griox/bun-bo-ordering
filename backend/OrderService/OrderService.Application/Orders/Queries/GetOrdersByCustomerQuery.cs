using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Queries;
using OrderService.Application.Dtos;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Queries;

public record GetOrdersByCustomerQuery(Guid CustomerId) : IRequest<List<OrderDetailDto>>;

public class GetOrdersByCustomerQueryHandler : IRequestHandler<GetOrdersByCustomerQuery, List<OrderDetailDto>>
{
    private readonly IAppDbContext _context;

    public GetOrdersByCustomerQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderDetailDto>> Handle(GetOrdersByCustomerQuery request, CancellationToken cancellationToken)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .Where(o => o.CustomerId == request.CustomerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(o => new OrderDetailDto
        {
            Id = o.Id,
            TableSessionId = o.TableSessionId,
            TableCode = o.TableSession?.Table?.TableCode ?? string.Empty,
            TableName = o.TableSession?.Table?.Name ?? "Mang đi",
            TotalAmount = o.TotalAmount,
            Status = o.Status.ToString(),
            PaymentMethod = o.PaymentMethod,
            Note = o.Note,
            CreatedAt = o.CreatedAt,
            OrderItems = o.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                FoodId = oi.FoodId,
                ProductName = oi.ProductName,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                TotalPrice = oi.TotalPrice,
                Note = oi.Note
            }).ToList()
        }).ToList();
    }
}
