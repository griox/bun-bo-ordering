namespace CartService.Application.Interfaces;

public interface ISyncCatalogClient
{
    Task<(decimal Price, bool IsAvailable, string Name)> GetFoodPriceAsync(Guid foodId);
}
