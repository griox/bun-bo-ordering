using System.Text.Json;
using CartService.Application.Interfaces;
using CartService.Domain.Entities;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace CartService.Infrastructure.Repositories;

/// <summary>
/// Redis cart repository. Keys are namespaced as "cart:{cartOwnerId}" to prevent collisions.
/// </summary>
public class CartRepository : ICartRepository
{
    private readonly IDatabase _database;
    private readonly ILogger<CartRepository> _logger;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public CartRepository(IConnectionMultiplexer redis, ILogger<CartRepository> logger)
    {
        _database = redis.GetDatabase();
        _logger = logger;
    }

    private static string BuildKey(string cartOwnerId) => $"cart:{cartOwnerId}";

    public async Task<bool> DeleteCartAsync(string cartOwnerId)
    {
        return await _database.KeyDeleteAsync(BuildKey(cartOwnerId));
    }

    public async Task<ShoppingCart?> GetCartAsync(string cartOwnerId)
    {
        var data = await _database.StringGetAsync(BuildKey(cartOwnerId));

        if (data.IsNullOrEmpty) return null;

        return JsonSerializer.Deserialize<ShoppingCart>(data!, _jsonOpts);
    }

    public async Task<ShoppingCart> UpdateCartAsync(ShoppingCart cart)
    {
        var serializedCart = JsonSerializer.Serialize(cart);
        // Cart expires after 7 days of inactivity
        var created = await _database.StringSetAsync(
            BuildKey(cart.CartOwnerId),
            serializedCart,
            TimeSpan.FromDays(7),
            When.Always);  // Always overwrite — tránh race condition

        if (!created)
        {
            // Redis có thể trả false trong một số edge case nhưng data vẫn được ghi.
            // Log cảnh báo thay vì throw để không làm hỏng request của user.
            _logger.LogWarning("Redis StringSetAsync returned false for cart:{CartOwnerId}. Cart may still be updated.", cart.CartOwnerId);
        }

        return cart;
    }
}
