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

    public async Task<bool> DeleteCartAsync(string cartOwnerId)
    {
        return await _database.KeyDeleteAsync(cartOwnerId);
    }

    public async Task<ShoppingCart?> GetCartAsync(string cartOwnerId)
    {
        var data = await _database.StringGetAsync(cartOwnerId);

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
        var created = await _database.StringSetAsync(cart.CartOwnerId, serializedCart, TimeSpan.FromDays(7));

        if (!created)
        {
            throw new Exception("Could not update cart in Redis");
        }

        return await GetCartAsync(cart.CartOwnerId) ?? cart;
    }
}
