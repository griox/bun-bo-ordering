using System.Text;
using System.Text.Json;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace OrderService.Infrastructure.SyncDataServices.Http;

public class CartDataClient : ICartDataClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly Microsoft.Extensions.Logging.ILogger<CartDataClient> _logger;

    public CartDataClient(HttpClient httpClient, IConfiguration configuration, Microsoft.Extensions.Logging.ILogger<CartDataClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CartDto?> GetCartAsync(string cartOwnerId)
    {
        var cartServiceUrl = _configuration["CartServiceUrl"] ?? "http://cart-service:8080";
        try 
        {
            _logger.LogInformation("Attempting to get cart from {Url}", $"{cartServiceUrl}/api/cart/{cartOwnerId}");
            var response = await _httpClient.GetAsync($"{cartServiceUrl}/api/cart/{cartOwnerId}");

            if (response.IsSuccessStatusCode)
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return await JsonSerializer.DeserializeAsync<CartDto>(
                    await response.Content.ReadAsStreamAsync(), options);
            }
            
            _logger.LogWarning("Failed to get cart. Status: {Status}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error connecting to Cart Service at {Url}", cartServiceUrl);
        }

        return null;
    }

    public async Task ClearCartAsync(string cartOwnerId)
    {
        var cartServiceUrl = _configuration["CartServiceUrl"] ?? "http://cart-service:8080";
        var emptyCartPayload = new { cart = new { cartOwnerId = cartOwnerId, items = new object[] {} } };
        var httpContent = new StringContent(
            JsonSerializer.Serialize(emptyCartPayload),
            Encoding.UTF8,
            "application/json");

        try 
        {
            _logger.LogInformation("Attempting to clear cart at {Url}", $"{cartServiceUrl}/api/cart");
            var response = await _httpClient.PostAsync($"{cartServiceUrl}/api/cart", httpContent);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to clear cart. Status: {Status}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cart at {Url}", cartServiceUrl);
        }
    }
}
