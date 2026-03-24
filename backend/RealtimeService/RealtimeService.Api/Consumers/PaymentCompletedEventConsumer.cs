using BunBo.SharedKernel.Messaging;
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
                var order = JsonSerializer.Deserialize<JsonElement>(content);
                
                // Note: Ensure the JSON matches the schema we expect for Kitchen
                var tableSessionId = order.GetProperty("tableSessionId").GetGuid();
                var totalAmount = order.GetProperty("totalAmount").GetDecimal();
                var note = order.TryGetProperty("note", out var noteProp) ? noteProp.GetString() : null;
                var createdAt = order.GetProperty("createdAt").GetDateTime();

                // 2. Notify Admin/Kitchen
                await _hubContext.Clients.Group("KitchenGroup").SendAsync("ReceiveNewOrder", new 
                {
                    OrderId = message.OrderId,
                    TableSessionId = tableSessionId,
                    TotalAmount = totalAmount,
                    Note = note,
                    CreatedAt = createdAt
                });

                // 3. Notify the exact Table
                await _hubContext.Clients.Group($"Table-{tableSessionId}").SendAsync("PaymentSuccess", new 
                {
                    OrderId = message.OrderId,
                    TransactionId = message.TransactionId
                });
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
