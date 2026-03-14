using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using BunBo.SharedKernel.Messaging;

namespace OrderService.Application.Orders.Commands;

public record CreateOrderCommand(Guid TableSessionId, Guid? CustomerId, string? Note) : IRequest<Guid>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ICartDataClient _cartDataClient;

    public CreateOrderCommandHandler(IAppDbContext context, IPublishEndpoint publishEndpoint, ICartDataClient cartDataClient)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _cartDataClient = cartDataClient;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var session = await _context.TableSessions.FindAsync(new object[] { request.TableSessionId }, cancellationToken);
        if (session == null)
        {
            throw new Exception("TableSession not found.");
        }
        if (session.IsClosed)
        {
            throw new Exception("Session is closed. Cannot place new orders.");
        }

        var cartOwnerId = request.TableSessionId.ToString();
        var cart = await _cartDataClient.GetCartAsync(cartOwnerId);

        if (cart == null || !cart.Items.Any())
        {
            throw new Exception("Giỏ hàng đang trống. Không thể tạo đơn.");
        }

        var order = new Order(request.TableSessionId, request.CustomerId, request.Note);

        foreach (var itemDto in cart.Items)
        {
            var orderItem = new OrderItem(order.Id, itemDto.FoodId, itemDto.FoodName, itemDto.Quantity, itemDto.UnitPrice, null);
            order.AddItem(orderItem);
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Publish OrderCreatedEvent via RabbitMQ
        await _publishEndpoint.Publish(new OrderCreatedEvent
        {
            OrderId = order.Id,
            TableSessionId = order.TableSessionId,
            TotalAmount = order.TotalAmount,
            Note = order.Note,
            CreatedAt = order.CreatedAt
        }, cancellationToken);

        // Clear the cart after successful order creation
        await _cartDataClient.ClearCartAsync(cartOwnerId);

        return order.Id;
    }
}
