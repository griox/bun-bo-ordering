using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using RealtimeService.Api.Hubs;

namespace RealtimeService.Api.Consumers;

public class PaymentCompletedEventConsumer : IConsumer<PaymentCompletedEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PaymentCompletedEventConsumer> _logger;

    public PaymentCompletedEventConsumer(IHubContext<NotificationHub> hubContext, ILogger<PaymentCompletedEventConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedEvent> context)
    {
        var message = context.Message;
        
        if (!message.IsSuccess)
        {
            _logger.LogWarning($"Payment failed for Order {message.OrderId}");
            return;
        }

        _logger.LogInformation($"Payment SUCCESS for Order {message.OrderId}. Notifying Table and Kitchen.");

        // 1. Notify Admin/Kitchen
        _logger.LogInformation($"Broadcasting ReceiveNewOrder to {HubConstants.KitchenGroup} and {HubConstants.AdminGroup} for Order {message.OrderId}");
        await _hubContext.Clients.Groups(HubConstants.KitchenGroup, HubConstants.AdminGroup).SendAsync(HubConstants.Events.ReceiveNewOrder, new 
        {
            OrderId = message.OrderId,
            TableNumber = message.TableNumber ?? "N/A",
            TableSessionId = message.TableSessionId ?? Guid.Empty,
            TotalAmount = message.Amount,
            Note = message.Note,
            CreatedAt = message.CompletedAt,
            PaymentMethod = "Transfer"
        });

        // 2. Notify the exact Table
        if (message.TableSessionId.HasValue)
        {
            var tableGroupName = HubConstants.TableGroup(message.TableSessionId.Value.ToString());
            _logger.LogInformation($"Broadcasting PaymentSuccess to group {tableGroupName} for Order {message.OrderId}");
            await _hubContext.Clients.Group(tableGroupName).SendAsync(HubConstants.Events.PaymentSuccess, new 
            {
                OrderId = message.OrderId,
                TransactionId = message.TransactionId
            });
        }
        
        _logger.LogInformation($"Successfully sent notifications for Order {message.OrderId}");
    }
}
