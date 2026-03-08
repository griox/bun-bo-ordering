using BunBo.SharedKernel.Messaging;
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

        // 1. Notify the Kitchen unconditionally
        await _hubContext.Clients.Group("KitchenGroup").SendAsync("ReceiveNewOrder", new 
        {
            OrderId = message.OrderId,
            TableSessionId = message.TableSessionId,
            TotalAmount = message.TotalAmount,
            Note = message.Note,
            CreatedAt = message.CreatedAt
        });

        // 2. Notify the specific Table that their order was successfully placed/received
        await _hubContext.Clients.Group($"Table-{message.TableSessionId}").SendAsync("OrderConfirmed", new 
        {
            OrderId = message.OrderId,
            Status = "Pending"
        });
    }
}
