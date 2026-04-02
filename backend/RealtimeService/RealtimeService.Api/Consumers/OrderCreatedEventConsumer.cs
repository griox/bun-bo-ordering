using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using RealtimeService.Api.Hubs;

namespace RealtimeService.Api.Consumers;

public class OrderCreatedEventConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<OrderCreatedEventConsumer> _logger;

    public OrderCreatedEventConsumer(IHubContext<NotificationHub> hubContext, ILogger<OrderCreatedEventConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"Received OrderCreatedEvent for Order {message.OrderId}");

        // 1. Notify the specific Table that their order was successfully placed/received
        await _hubContext.Clients.Group($"Table-{message.TableSessionId}").SendAsync("OrderConfirmed", new 
        {
            OrderId = message.OrderId,
            Status = "Pending"
        });

        // 2. Notify the Admin group that a new order has arrived (ONLY if Cash)
        // If Transfer, we wait for PaymentCompletedEvent to notify Admin
        if (message.PaymentMethod == "Cash")
        {
            _logger.LogInformation($"Notifying Admin of new CASH order {message.OrderId}");
            await _hubContext.Clients.Group("Admin").SendAsync("OrderPlaced", new 
            {
                OrderId = message.OrderId,
                TotalAmount = message.TotalAmount,
                CreatedAt = message.CreatedAt,
                TableSessionId = message.TableSessionId,
                PaymentMethod = "Cash"
            });
        }
        else
        {
            _logger.LogInformation($"Skipping Admin notification for TRANSFER order {message.OrderId}. Waiting for payment.");
        }
    }
}
