using BunBo.SharedKernel;

namespace OrderService.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }

    public Guid FoodId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal TotalPrice => Quantity * UnitPrice;
    public string? Note { get; private set; }

    protected OrderItem() { }

    public OrderItem(Guid orderId, Guid foodId, string productName, int quantity, decimal unitPrice, string? note)
    {
        OrderId = orderId;
        FoodId = foodId;
        ProductName = productName;
        Quantity = quantity;
        UnitPrice = unitPrice;
        Note = note;
    }
}
