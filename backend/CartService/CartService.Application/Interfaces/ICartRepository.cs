using CartService.Domain.Entities;

namespace CartService.Application.Interfaces;

public interface ICartRepository
{
    Task<ShoppingCart?> GetCartAsync(string cartOwnerId);
    Task<ShoppingCart> UpdateCartAsync(ShoppingCart cart);
    Task<bool> DeleteCartAsync(string cartOwnerId);
}
