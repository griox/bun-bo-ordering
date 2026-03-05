using System.Text.Json;
using CartService.Application.Interfaces;
using CartService.Domain.Entities;
using StackExchange.Redis;

namespace CartService.Infrastructure.Repositories;

public class CartRepository : ICartRepository
{
    private readonly IDatabase _database;

    public CartRepository(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<bool> DeleteCartAsync(string customerUsername)
    {
        return await _database.KeyDeleteAsync(customerUsername);
    }

    public async Task<ShoppingCart?> GetCartAsync(string customerUsername)
    {
        var data = await _database.StringGetAsync(customerUsername);

        if (data.IsNullOrEmpty)
        {
            return null;
        }

        return JsonSerializer.Deserialize<ShoppingCart>(data!, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<ShoppingCart> UpdateCartAsync(ShoppingCart cart)
    {
        var serializedCart = JsonSerializer.Serialize(cart);
        // Cart expires after 7 days of inactivity
        var created = await _database.StringSetAsync(cart.CustomerUsername, serializedCart, TimeSpan.FromDays(7));

        if (!created)
        {
            return null!;
        }

        return await GetCartAsync(cart.CustomerUsername);
    }
}
