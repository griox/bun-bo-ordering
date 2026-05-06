using CartService.Application.Interfaces;
using CatalogService.Api.Protos;
using Grpc.Core;
using Microsoft.Extensions.Logging;

namespace CartService.Infrastructure.SyncDataServices.Grpc;

public class CatalogDataClient : ISyncCatalogClient
{
    private readonly CatalogGrpc.CatalogGrpcClient _client;
    private readonly ILogger<CatalogDataClient> _logger;

    // Timeout cứng cho mỗi gRPC call — tránh block request khi CatalogService bận
    private static readonly TimeSpan GrpcDeadline = TimeSpan.FromSeconds(5);

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
            var response = await _client.GetFoodPriceAsync(
                request,
                deadline: DateTime.UtcNow.Add(GrpcDeadline));
            return new FoodItemInfo((decimal)response.Price, response.IsAvailable, response.Name);
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
    /// </summary>
    public async Task<Dictionary<Guid, FoodItemInfo>> GetFoodPricesManyAsync(IEnumerable<Guid> foodIds)
    {
        var ids = foodIds.Distinct().ToList();
        _logger.LogInformation("--> Batch-fetching {Count} food items from CatalogService via gRPC.", ids.Count);

        try
        {
            var request = new GetFoodPricesRequest();
            request.FoodIds.AddRange(ids.Select(id => id.ToString()));

            var response = await _client.GetFoodPricesAsync(
                request,
                deadline: DateTime.UtcNow.Add(GrpcDeadline));

            return response.FoodPrices.ToDictionary(
                kvp => Guid.Parse(kvp.Key),
                kvp => new FoodItemInfo((decimal)kvp.Value.Price, kvp.Value.IsAvailable, kvp.Value.Name)
            );
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.DeadlineExceeded)
        {
            _logger.LogWarning("--> gRPC batch timeout after {Timeout}s for {Count} IDs", GrpcDeadline.TotalSeconds, ids.Count);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "--> Batch gRPC call failed for {Count} IDs", ids.Count);
            throw;
        }
    }
}
