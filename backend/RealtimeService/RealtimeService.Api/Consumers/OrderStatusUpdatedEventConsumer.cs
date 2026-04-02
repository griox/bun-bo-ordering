using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using RealtimeService.Api.Hubs;

namespace RealtimeService.Api.Consumers;

public class OrderStatusUpdatedEventConsumer : IConsumer<OrderStatusUpdatedEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<OrderStatusUpdatedEventConsumer> _logger;

    public OrderStatusUpdatedEventConsumer(IHubContext<NotificationHub> hubContext, ILogger<OrderStatusUpdatedEventConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderStatusUpdatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"Received OrderStatusUpdatedEvent for Order {message.OrderId} -> {message.NewStatus}");

        // Notify Admin group about status change to trigger refresh
        await _hubContext.Clients.Group("Admin").SendAsync("OrderUpdated", new
        {
            OrderId = message.OrderId,
            NewStatus = message.NewStatus,
            UpdatedAt = message.UpdatedAt
        });
    }
}
