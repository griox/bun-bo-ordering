using CartService.Application.Interfaces;
using CartService.Domain.Entities;
using MediatR;

namespace CartService.Application.Cart.Commands;

public record UpdateCartCommand(ShoppingCart Cart) : IRequest<ShoppingCart>;

public class UpdateCartCommandHandler : IRequestHandler<UpdateCartCommand, ShoppingCart>
{
    private readonly ICartRepository _repository;
    private readonly ISyncCatalogClient _catalogClient;

    public UpdateCartCommandHandler(ICartRepository repository, ISyncCatalogClient catalogClient)
    {
        _repository = repository;
        _catalogClient = catalogClient;
    }

    public async Task<ShoppingCart> Handle(UpdateCartCommand request, CancellationToken cancellationToken)
    {
        if (!request.Cart.Items.Any())
        {
            return await _repository.UpdateCartAsync(request.Cart);
        }

        // Batch-fetch all food prices in a single parallel gRPC round-trip (fixes N+1 issue)
        var foodIds = request.Cart.Items.Select(i => i.FoodId);
        var catalogItems = await _catalogClient.GetFoodPricesManyAsync(foodIds);

        foreach (var item in request.Cart.Items)
        {
            if (!catalogItems.TryGetValue(item.FoodId, out var catalogItem))
            {
                throw new Exception($"Food item {item.FoodId} not found in catalog.");
            }

            if (!catalogItem.IsAvailable)
            {
                throw new Exception($"Món \"{catalogItem.Name}\" hiện không còn phục vụ.");
            }

            // Sync price and name from source of truth (Catalog)
            item.UnitPrice = catalogItem.Price;
            item.FoodName = catalogItem.Name;
        }

        return await _repository.UpdateCartAsync(request.Cart);
    }
}
