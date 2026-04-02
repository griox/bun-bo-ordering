using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;

namespace OrderService.Application.Orders.Commands;

public record CreateOrderCommand(Guid TableSessionId, Guid? CustomerId, string? Note, string PaymentMethod) : IRequest<Guid>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ICartDataClient _cartDataClient;
    private readonly Microsoft.Extensions.Logging.ILogger<CreateOrderCommandHandler> _logger;

    public CreateOrderCommandHandler(IAppDbContext context, IPublishEndpoint publishEndpoint, ICartDataClient cartDataClient, Microsoft.Extensions.Logging.ILogger<CreateOrderCommandHandler> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _cartDataClient = cartDataClient;
        _logger = logger;
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
        _logger.LogInformation("[ORDER] Fetching cart for {CartOwnerId}", cartOwnerId);
        var cart = await _cartDataClient.GetCartAsync(cartOwnerId);

        if (cart == null || !cart.Items.Any())
        {
            _logger.LogWarning("[ORDER] Cart is empty for {CartOwnerId}", cartOwnerId);
            throw new Exception("Giỏ hàng đang trống. Không thể tạo đơn.");
        }

        var order = new Order(request.TableSessionId, request.CustomerId, request.Note, request.PaymentMethod);

        foreach (var itemDto in cart.Items)
        {
            var orderItem = new OrderItem(order.Id, itemDto.FoodId, itemDto.FoodName, itemDto.Quantity, itemDto.UnitPrice, null);
            order.AddItem(orderItem);
        }

        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        // Publish OrderCreatedEvent via RabbitMQ
        _logger.LogInformation("[ORDER] Publishing OrderCreatedEvent for Order {OrderId}", order.Id);
        await _publishEndpoint.Publish(new OrderCreatedEvent
        {
            OrderId = order.Id,
            TableSessionId = order.TableSessionId,
            TotalAmount = order.TotalAmount,
            Note = order.Note,
            PaymentMethod = order.PaymentMethod,
            CreatedAt = order.CreatedAt
        }, cancellationToken);
        _logger.LogInformation("[ORDER] OrderCreatedEvent published for Order {OrderId}", order.Id);

        // Clear the cart after successful order creation
        _logger.LogInformation("[ORDER] Clearing cart for {CartOwnerId}", cartOwnerId);
        await _cartDataClient.ClearCartAsync(cartOwnerId);
        _logger.LogInformation("[ORDER] Cart cleared for {CartOwnerId}", cartOwnerId);

        return order.Id;
    }
}
