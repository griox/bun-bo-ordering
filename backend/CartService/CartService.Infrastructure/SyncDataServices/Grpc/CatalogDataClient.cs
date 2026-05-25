using CartService.Application.Interfaces;
using CatalogService.Api.Protos;
using Grpc.Core;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace CartService.Infrastructure.SyncDataServices.Grpc;

public class CatalogDataClient : ISyncCatalogClient
{
    private readonly CatalogGrpc.CatalogGrpcClient _client;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CatalogDataClient> _logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    // Timeout cứng cho mỗi gRPC call — tránh block request khi CatalogService bận
    private static readonly TimeSpan GrpcDeadline = TimeSpan.FromSeconds(15);

    public CatalogDataClient(CatalogGrpc.CatalogGrpcClient client, IMemoryCache cache, ILogger<CatalogDataClient> logger)
    {
        _client = client;
        _cache = cache;
        _logger = logger;
    }

    public async Task<FoodItemInfo> GetFoodPriceAsync(Guid foodId)
    {
        var cacheKey = $"FoodItem_{foodId}";
        if (_cache.TryGetValue(cacheKey, out FoodItemInfo? cachedItem))
        {
            return cachedItem!;
        }

        _logger.LogInformation("--> Calling gRPC CatalogService for Food ID: {FoodId}", foodId);
        try
        {
            var request = new GetFoodPriceRequest { FoodId = foodId.ToString() };
            var response = await _client.GetFoodPriceAsync(
                request,
                deadline: DateTime.UtcNow.Add(GrpcDeadline));
            
            var item = new FoodItemInfo((decimal)response.Price, response.IsAvailable, response.Name);
            _cache.Set(cacheKey, item, CacheDuration);
            return item;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.DeadlineExceeded)
        {
            _logger.LogWarning("--> gRPC timeout after {Timeout}s for Food ID: {FoodId}", GrpcDeadline.TotalSeconds, foodId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "--> gRPC call failed for Food ID: {FoodId}", foodId);
            throw;
        }
    }

    /// <summary>
    /// Batch-fetches multiple food items using a single gRPC call.
    /// Replaces the N+1 pattern — significantly more efficient under load.
    /// Uses IMemoryCache to reduce network calls.
    /// </summary>
    public async Task<Dictionary<Guid, FoodItemInfo>> GetFoodPricesManyAsync(IEnumerable<Guid> foodIds)
    {
        var ids = foodIds.Distinct().ToList();
        var result = new Dictionary<Guid, FoodItemInfo>();
        var missingIds = new List<Guid>();

        foreach (var id in ids)
        {
            if (_cache.TryGetValue($"FoodItem_{id}", out FoodItemInfo? cachedItem))
            {
                result[id] = cachedItem!;
            }
            else
            {
                missingIds.Add(id);
            }
        }

        if (!missingIds.Any()) return result;

        _logger.LogInformation("--> Batch-fetching {Count} missing food items from CatalogService via gRPC.", missingIds.Count);

        try
        {
            var request = new GetFoodPricesRequest();
            request.FoodIds.AddRange(missingIds.Select(id => id.ToString()));

            var response = await _client.GetFoodPricesAsync(
                request,
                deadline: DateTime.UtcNow.Add(GrpcDeadline));

            foreach (var kvp in response.FoodPrices)
            {
                var id = Guid.Parse(kvp.Key);
                var item = new FoodItemInfo((decimal)kvp.Value.Price, kvp.Value.IsAvailable, kvp.Value.Name);
                
                _cache.Set($"FoodItem_{id}", item, CacheDuration);
                result[id] = item;
            }

            return result;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.DeadlineExceeded)
        {
            _logger.LogWarning("--> gRPC batch timeout after {Timeout}s for {Count} IDs", GrpcDeadline.TotalSeconds, missingIds.Count);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "--> Batch gRPC call failed for {Count} IDs", missingIds.Count);
            throw;
        }
    }
}
