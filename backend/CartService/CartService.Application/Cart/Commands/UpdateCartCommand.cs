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
        // Call gRPC Catalog Service to verify price and availability for each item
        foreach (var item in request.Cart.Items)
        {
            var catalogItem = await _catalogClient.GetFoodPriceAsync(item.FoodId);
            
            if (!catalogItem.IsAvailable)
            {
                throw new Exception($"Food item {catalogItem.Name} is currently unavailable.");
            }

            // Sync the price and name from the source of truth (Catalog)
            item.UnitPrice = catalogItem.Price;
            item.FoodName = catalogItem.Name;
        }

        return await _repository.UpdateCartAsync(request.Cart);
    }
}
