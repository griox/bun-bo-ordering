using MassTransit;
using MediatR;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

using BunBo.SharedKernel;

namespace OrderService.Application.Orders.Commands;

public record CreateOrderCommand(Guid TableSessionId, Guid? CustomerId, string? Note, string PaymentMethod, string? VoucherCode = null, decimal DiscountAmount = 0) : IRequest<Guid>;

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
        var session = await _context.TableSessions
            .Include(s => s.Table)
            .SingleOrDefaultAsync(s => s.Id == request.TableSessionId, cancellationToken);
            
        if (session == null)
        {
            throw new DomainException("TableSession not found.");
        }
        if (session.IsClosed)
        {
            throw new DomainException("Session is closed. Cannot place new orders.");
        }

        var cartOwnerId = request.TableSessionId.ToString();
        _logger.LogInformation("[ORDER] Fetching cart for {CartOwnerId}", cartOwnerId);
        var cart = await _cartDataClient.GetCartAsync(cartOwnerId);

        if (cart == null || !cart.Items.Any())
        {
            _logger.LogWarning("[ORDER] Cart is empty for {CartOwnerId}", cartOwnerId);
            throw new DomainException("Giỏ hàng đang trống. Không thể tạo đơn.");
        }

        var order = new Order(request.TableSessionId, request.CustomerId, request.Note, request.PaymentMethod, request.VoucherCode, request.DiscountAmount);

        foreach (var itemDto in cart.Items)
        {
            var orderItem = new OrderItem(order.Id, itemDto.FoodId, itemDto.FoodName, itemDto.Quantity, itemDto.UnitPrice, itemDto.Note);
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
            TableNumber = session.Table?.Name ?? "N/A",
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            VoucherCode = order.VoucherCode,
            Note = order.Note,
            PaymentMethod = order.PaymentMethod,
            CreatedAt = order.CreatedAt
        }, cancellationToken);
        _logger.LogInformation("[ORDER] OrderCreatedEvent published for Order {OrderId}", order.Id);

        // Clear the cart after successful order creation.
        // Wrapped in try/catch: if clearing fails, the order is still valid.
        // The cart will expire naturally after 7 days.
        try
        {
            _logger.LogInformation("[ORDER] Clearing cart for {CartOwnerId}", cartOwnerId);
            await _cartDataClient.ClearCartAsync(cartOwnerId);
            _logger.LogInformation("[ORDER] Cart cleared for {CartOwnerId}", cartOwnerId);
        }
        catch (Exception clearEx)
        {
            _logger.LogWarning(clearEx, "[ORDER] Failed to clear cart for {CartOwnerId}. Order {OrderId} was created successfully.", cartOwnerId, order.Id);
        }

        return order.Id;
    }
}
