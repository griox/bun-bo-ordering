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

    public CartDataClient(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<CartDto?> GetCartAsync(string cartOwnerId)
    {
        var cartServiceUrl = _configuration["CartServiceUrl"] ?? "http://cart-service:8080";
        var response = await _httpClient.GetAsync($"{cartServiceUrl}/api/cart/{cartOwnerId}");

        if (response.IsSuccessStatusCode)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return await JsonSerializer.DeserializeAsync<CartDto>(
                await response.Content.ReadAsStreamAsync(), options);
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

        await _httpClient.PostAsync($"{cartServiceUrl}/api/cart", httpContent);
    }
}
