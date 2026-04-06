using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Application.Dtos;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Queries;

public record GetRecentOrderForCustomerQuery(Guid CustomerId) : IRequest<List<OrderItemDto>>;

public class GetRecentOrderForCustomerQueryHandler : IRequestHandler<GetRecentOrderForCustomerQuery, List<OrderItemDto>>
{
    private readonly IAppDbContext _context;

    public GetRecentOrderForCustomerQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderItemDto>> Handle(GetRecentOrderForCustomerQuery request, CancellationToken cancellationToken)
    {
        // First get the most recent paid or completed order
        var recentOrder = await _context.Orders
            .Where(o => o.CustomerId == request.CustomerId && o.Status == OrderStatus.Paid)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (recentOrder == null)
            return new List<OrderItemDto>();

        // Get the items for that order
        var orderItems = await _context.OrderItems
            .Where(oi => oi.OrderId == recentOrder.Id)
            .ToListAsync(cancellationToken);

        return orderItems.Select(oi => new OrderItemDto
        {
            Id = oi.Id, 
            FoodId = oi.FoodId, 
            ProductName = oi.ProductName, 
            Quantity = oi.Quantity, 
            UnitPrice = oi.UnitPrice, 
            TotalPrice = oi.TotalPrice,
            Note = oi.Note
        }).ToList();
    }
}
