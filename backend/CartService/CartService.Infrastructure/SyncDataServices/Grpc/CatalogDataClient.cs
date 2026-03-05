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

    public async Task<(decimal Price, bool IsAvailable, string Name)> GetFoodPriceAsync(Guid foodId)
    {
        _logger.LogInformation($"--> Calling gRPC Service Catalog for Food ID: {foodId}");

        try
        {
            var request = new GetFoodPriceRequest { FoodId = foodId.ToString() };
            var response = await _client.GetFoodPriceAsync(request);

            return ((decimal)response.Price, response.IsAvailable, response.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError($"--> Could NOT call gRPC Server: {ex.Message}");
            throw;
        }
    }
}
