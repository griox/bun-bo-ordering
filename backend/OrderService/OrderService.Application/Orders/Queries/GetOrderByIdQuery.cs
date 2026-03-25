using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Application.Dtos;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

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
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null) return null;

        return new OrderDetailDto
        {
            Id = order.Id,
            TableSessionId = order.TableSessionId,
            TotalAmount = order.TotalAmount,
            Status = order.Status.ToString(),
            Note = order.Note,
            CreatedAt = order.CreatedAt,
            OrderItems = order.OrderItems.Select(i => new OrderItemDto
            {
                Id = i.Id,
                FoodId = i.FoodId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice,
                Note = i.Note
            }).ToList()
        };
    }
}
