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

        // 1. Notify Admin/Kitchen group about status change to trigger refresh on Dashboard
        await _hubContext.Clients.Group(HubConstants.KitchenGroup).SendAsync(HubConstants.Events.OrderUpdated, new
        {
            OrderId = message.OrderId,
            TableSessionId = message.TableSessionId,
            NewStatus = message.NewStatus,
            UpdatedAt = message.UpdatedAt
        });

        // 2. If Paid, notify the specific Table to close their cart/lock order
        if (message.NewStatus == "Paid")
        {
            _logger.LogInformation($"Notifying {HubConstants.TableGroup(message.TableSessionId.ToString())} of PaymentSuccess for Order {message.OrderId}");
            await _hubContext.Clients.Group(HubConstants.TableGroup(message.TableSessionId.ToString())).SendAsync(HubConstants.Events.PaymentSuccess, new
            {
                OrderId = message.OrderId,
                TransactionId = "WEBHOOK_CONFIRMED"
            });
        }
    }
}
