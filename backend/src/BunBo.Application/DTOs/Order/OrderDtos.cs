using BunBo.Domain.Enums;

namespace BunBo.Application.DTOs.Order
{
    public class CreateOrderItemDto
    {
        public Guid FoodId { get; set; }
        public int Quantity { get; set; }
        public string? Note { get; set; }
    }

    public class CreateOrderRequestDto
    {
        public Guid TableSessionId { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = new List<CreateOrderItemDto>();
    }

    public class OrderResponseDto
    {
        public Guid Id { get; set; }
        public Guid TableSessionId { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        // Can add items detail later
    }
}
