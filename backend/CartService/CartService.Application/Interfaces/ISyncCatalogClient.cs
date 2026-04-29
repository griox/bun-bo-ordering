namespace CartService.Application.Interfaces;

public record FoodItemInfo(decimal Price, bool IsAvailable, string Name);

public interface ISyncCatalogClient
{
    Task<FoodItemInfo> GetFoodPriceAsync(Guid foodId);

    /// <summary>
    /// Batch-fetches price and availability for multiple food items in a single gRPC call.
    /// </summary>
    Task<Dictionary<Guid, FoodItemInfo>> GetFoodPricesManyAsync(IEnumerable<Guid> foodIds);
}
