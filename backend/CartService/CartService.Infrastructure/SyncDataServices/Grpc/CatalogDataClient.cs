using CartService.Application.Interfaces;
using CatalogService.Api.Protos;
using Microsoft.Extensions.Logging;

namespace CartService.Infrastructure.SyncDataServices.Grpc;

public class CatalogDataClient : ISyncCatalogClient
{
    private readonly CatalogGrpc.CatalogGrpcClient _client;
    private readonly ILogger<CatalogDataClient> _logger;

    public CatalogDataClient(CatalogGrpc.CatalogGrpcClient client, ILogger<CatalogDataClient> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<FoodItemInfo> GetFoodPriceAsync(Guid foodId)
    {
        _logger.LogInformation("--> Calling gRPC CatalogService for Food ID: {FoodId}", foodId);
        try
        {
            var request = new GetFoodPriceRequest { FoodId = foodId.ToString() };
            var response = await _client.GetFoodPriceAsync(request);
            return new FoodItemInfo((decimal)response.Price, response.IsAvailable, response.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "--> gRPC call failed for Food ID: {FoodId}", foodId);
            throw;
        }
    }

    /// <summary>
    /// Batch-fetches multiple food items using parallel gRPC calls.
    /// Replaces the N+1 pattern — consolidates all items into concurrent requests.
    /// </summary>
    public async Task<Dictionary<Guid, FoodItemInfo>> GetFoodPricesManyAsync(IEnumerable<Guid> foodIds)
    {
        var ids = foodIds.Distinct().ToList();
        _logger.LogInformation("--> Batch-fetching {Count} food items from CatalogService via gRPC.", ids.Count);

        var tasks = ids.Select(async id =>
        {
            var req = new GetFoodPriceRequest { FoodId = id.ToString() };
            var res = await _client.GetFoodPriceAsync(req);
            return (id, new FoodItemInfo((decimal)res.Price, res.IsAvailable, res.Name));
        });

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(r => r.id, r => r.Item2);
    }
}
