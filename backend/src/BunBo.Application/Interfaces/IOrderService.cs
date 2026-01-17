using BunBo.Domain.Entities;

namespace BunBo.Application.Interfaces
{
    public interface IOrderService
    {
        // Enforces: Order must belong to the Session, and Sesssion must belong to the Table
        Task<Order> CreateOrderAsync(Guid tableSessionId, List<OrderItem> items);
        Task<Order?> GetOrderByIdAsync(Guid orderId);
    }
}
