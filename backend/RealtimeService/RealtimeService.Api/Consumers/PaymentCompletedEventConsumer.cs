using BunBo.SharedKernel.Messaging;
using Microsoft.Extensions.Logging;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using RealtimeService.Api.Hubs;
using System.Text.Json;

namespace RealtimeService.Api.Consumers;

public class PaymentCompletedEventConsumer : IConsumer<PaymentCompletedEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PaymentCompletedEventConsumer> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public PaymentCompletedEventConsumer(IHubContext<NotificationHub> hubContext, ILogger<PaymentCompletedEventConsumer> logger, IHttpClientFactory httpClientFactory)
    {
        _hubContext = hubContext;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
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

        // 1. Fetch Order Details from OrderService since PaymentCompletedEvent only contains OrderId
        try 
        {
            var apiClient = _httpClientFactory.CreateClient("OrderApiClient");
            var response = await apiClient.GetAsync($"/api/orders/{message.OrderId}");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var order = JsonSerializer.Deserialize<JsonElement>(content, options);
                
                if (order.ValueKind == JsonValueKind.Undefined || order.ValueKind == JsonValueKind.Null)
                {
                    _logger.LogError($"Failed to deserialize order data for Order {message.OrderId}");
                    return;
                }

                // Safely parse properties using TryGetProperty
                var tableSessionId = order.TryGetProperty("tableSessionId", out var tsIdProp) ? tsIdProp.GetGuid() : Guid.Empty;
                var totalAmount = order.TryGetProperty("totalAmount", out var taProp) ? taProp.GetDecimal() : 0m;
                var note = order.TryGetProperty("note", out var noteProp) ? noteProp.GetString() : null;
                var createdAt = order.TryGetProperty("createdAt", out var caProp) ? caProp.GetDateTime() : DateTime.UtcNow;
                var tableNumber = order.TryGetProperty("tableNumber", out var tnProp) ? tnProp.GetString() : "N/A";

                // 2. Notify Admin/Kitchen
                _logger.LogInformation($"Broadcasting ReceiveNewOrder to {HubConstants.KitchenGroup} and {HubConstants.AdminGroup} for Order {message.OrderId}");
                await _hubContext.Clients.Groups(HubConstants.KitchenGroup, HubConstants.AdminGroup).SendAsync(HubConstants.Events.ReceiveNewOrder, new 
                {
                    OrderId = message.OrderId,
                    TableNumber = tableNumber,
                    TableSessionId = tableSessionId,
                    TotalAmount = totalAmount,
                    Note = note,
                    CreatedAt = createdAt,
                    PaymentMethod = "Transfer"
                });

                // 3. Notify the exact Table
                var tableGroupName = HubConstants.TableGroup(tableSessionId.ToString());
                _logger.LogInformation($"Broadcasting PaymentSuccess to group {tableGroupName} for Order {message.OrderId}");
                await _hubContext.Clients.Group(tableGroupName).SendAsync(HubConstants.Events.PaymentSuccess, new 
                {
                    OrderId = message.OrderId,
                    TransactionId = message.TransactionId
                });
                _logger.LogInformation($"Successfully sent notifications for Order {message.OrderId}");
            }
            else
            {
                _logger.LogError($"Failed to fetch order details for Order {message.OrderId}. Status: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching order details for Order {message.OrderId}");
        }
    }
}
