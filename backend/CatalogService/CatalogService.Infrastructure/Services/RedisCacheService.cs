using CatalogService.Application.Interfaces;
using StackExchange.Redis;

namespace CatalogService.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly string _instanceName = "Catalog_";

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var endPoint = _redis.GetEndPoints().First();
        var server = _redis.GetServer(endPoint);
        var keys = server.Keys(pattern: _instanceName + prefix + "*").ToArray();
        
        if (keys.Any())
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(keys);
        }
    }
}
