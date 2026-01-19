using BunBo.Application.Interfaces;
using BunBo.Domain.Entities;
using BunBo.Domain.Enums;
using BunBo.Application.Common.Exceptions;

namespace BunBo.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;

        public OrderService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Order> CreateOrderAsync(Guid tableSessionId, List<OrderItem> items)
        {
            // 1. Validate Session
            var session = await _unitOfWork.Repository<TableSession>().GetByIdAsync(tableSessionId);
            if (session == null) throw new NotFoundException(nameof(TableSession), tableSessionId);
            if (session.IsClosed) throw new ValidationException(new [] { new FluentValidation.Results.ValidationFailure("TableSession", "Session is closed") });

            // 2. Prepare Order
            var order = new Order
            {
                TableSessionId = tableSessionId,
                Status = OrderStatus.PendingPayment,
                CreatedAt = DateTime.UtcNow
            };

            decimal grandTotal = 0;

            foreach (var item in items)
            {
                // 3. Snapshot Price (Security)
                var food = await _unitOfWork.Repository<Food>().GetByIdAsync(item.FoodId);
                if (food == null) throw new NotFoundException(nameof(Food), item.FoodId);
                if (!food.IsAvailable) throw new ValidationException(new [] { new FluentValidation.Results.ValidationFailure("Food", $"Food {food.Name} is not available") });

                item.UnitPrice = food.Price; // Snapshot
                // item.TotalPrice is calculated property
                
                grandTotal += item.Quantity * item.UnitPrice;
                order.OrderItems.Add(item);
            }

            order.TotalAmount = grandTotal;

            // 4. Save
            await _unitOfWork.Repository<Order>().AddAsync(order);
            await _unitOfWork.CompleteAsync();

            return order;
        }

        public async Task<Order?> GetOrderByIdAsync(Guid orderId)
        {
             // Include items? (Not in generic repo, might need Specific Specification or just Lazy Load)
             // MVP: Return basic
             return await _unitOfWork.Repository<Order>().GetByIdAsync(orderId);
        }
    }
}
