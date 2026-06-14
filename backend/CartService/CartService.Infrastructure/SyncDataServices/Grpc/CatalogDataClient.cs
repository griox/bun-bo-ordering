using CartService.Application.Interfaces;
using CatalogService.Api.Protos;
using Grpc.Core;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace CartService.Infrastructure.SyncDataServices.Grpc;

public class CatalogDataClient : ISyncCatalogClient
{
    private readonly CatalogGrpc.CatalogGrpcClient _client;
    private readonly IMemoryCache _cache;
    private readonly ILogger<CatalogDataClient> _logger;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    // Timeout cứng cho mỗi gRPC call — tránh block request khi CatalogService bận
    private static readonly TimeSpan GrpcDeadline = TimeSpan.FromSeconds(15);
    // Timeout cho việc chờ Semaphore lock tránh treo luồng vô thời hạn
    private static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(3);

    // Lock dictionary to prevent concurrent duplicate gRPC calls for the same food items
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _locks = new();

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

        var sem = _locks.GetOrAdd(foodId, _ => new SemaphoreSlim(1, 1));
        bool acquired = await sem.WaitAsync(LockTimeout);
        if (!acquired)
        {
            _logger.LogWarning("--> Semaphore lock wait timeout ({Timeout}s) for Food ID: {FoodId}. Calling gRPC directly without lock.", LockTimeout.TotalSeconds, foodId);
        }

        try
        {
            // Double-check cache
            if (_cache.TryGetValue(cacheKey, out cachedItem))
            {
                return cachedItem!;
            }

            _logger.LogInformation("--> Calling gRPC CatalogService for Food ID: {FoodId}", foodId);
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
        finally
        {
            if (acquired)
            {
                sem.Release();
            }
        }
    }

    /// <summary>
    /// Batch-fetches multiple food items using a single gRPC call.
    /// Replaces the N+1 pattern — significantly more efficient under load.
    /// Uses IMemoryCache to reduce network calls.
    /// Prevents Cache Stampede by locking per-food-item using a sorted keys strategy.
    /// </summary>
    public async Task<Dictionary<Guid, FoodItemInfo>> GetFoodPricesManyAsync(IEnumerable<Guid> foodIds)
    {
        var ids = foodIds.Distinct().ToList();
        var result = new Dictionary<Guid, FoodItemInfo>();
        var initialMissingIds = new List<Guid>();

        // 1. Check cache first (fast path)
        foreach (var id in ids)
        {
            if (_cache.TryGetValue($"FoodItem_{id}", out FoodItemInfo? cachedItem))
            {
                result[id] = cachedItem!;
            }
            else
            {
                initialMissingIds.Add(id);
            }
        }

        if (!initialMissingIds.Any()) return result;

        // 2. Sort keys to prevent Deadlocks (lock order inversion)
        var sortedMissingIds = initialMissingIds.OrderBy(id => id).ToList();
        var acquiredLocks = new List<SemaphoreSlim>();

        try
        {
            // Acquire locks in sorted order with timeout
            foreach (var id in sortedMissingIds)
            {
                var sem = _locks.GetOrAdd(id, _ => new SemaphoreSlim(1, 1));
                bool acquired = await sem.WaitAsync(LockTimeout);
                if (acquired)
                {
                    acquiredLocks.Add(sem);
                }
                else
                {
                    _logger.LogWarning("--> Semaphore lock wait timeout ({Timeout}s) for Food ID: {FoodId} in batch fetch. Proceeding without lock.", LockTimeout.TotalSeconds, id);
                }
            }

            // 3. Double-check cache inside locks
            var finalMissingIds = new List<Guid>();
            foreach (var id in sortedMissingIds)
            {
                if (_cache.TryGetValue($"FoodItem_{id}", out FoodItemInfo? cachedItem))
                {
                    result[id] = cachedItem!;
                }
                else
                {
                    finalMissingIds.Add(id);
                }
            }

            if (!finalMissingIds.Any()) return result;

            // 4. Batch-fetch from gRPC
            _logger.LogInformation("--> Batch-fetching {Count} missing food items from CatalogService via gRPC.", finalMissingIds.Count);

            var request = new GetFoodPricesRequest();
            request.FoodIds.AddRange(finalMissingIds.Select(id => id.ToString()));

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
            _logger.LogWarning("--> gRPC batch timeout after {Timeout}s for {Count} IDs", GrpcDeadline.TotalSeconds, sortedMissingIds.Count);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "--> Batch gRPC call failed for {Count} IDs", sortedMissingIds.Count);
            throw;
        }
        finally
        {
            // Release locks in reverse order
            for (int i = acquiredLocks.Count - 1; i >= 0; i--)
            {
                acquiredLocks[i].Release();
            }
        }
    }
}
