using OrderService.Application.Dtos;

namespace OrderService.Application.Interfaces;

public interface ICartDataClient
{
    Task<CartDto?> GetCartAsync(string cartOwnerId);
    Task ClearCartAsync(string cartOwnerId);
}
