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
        await _hubContext.Clients.Group(HubConstants.TableGroup(message.TableSessionId.ToString())).SendAsync(HubConstants.Events.OrderConfirmed, new 
        {
            OrderId = message.OrderId,
            Status = "Pending"
        });

        // 2. Notify the Admin/Kitchen group that a new order has arrived (Skip kitchen notification for Transfer until payment completes)
        if (message.PaymentMethod != "Transfer")
        {
            _logger.LogInformation($"Notifying Kitchen of new order {message.OrderId}");
            await _hubContext.Clients.Group(HubConstants.KitchenGroup).SendAsync(HubConstants.Events.ReceiveNewOrder, new 
            {
                OrderId = message.OrderId,
                TableNumber = message.TableNumber,
                TotalAmount = message.TotalAmount,
                CreatedAt = message.CreatedAt,
                TableSessionId = message.TableSessionId,
                PaymentMethod = message.PaymentMethod,
                Note = message.Note
            });
        }
    }
}
