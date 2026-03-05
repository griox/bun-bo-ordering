using BunBo.SharedKernel;
using OrderService.Domain.Enums;

namespace OrderService.Domain.Entities;

public class Order : BaseEntity
{
    public Guid TableSessionId { get; private set; }
    public TableSession? TableSession { get; private set; }

    public decimal TotalAmount { get; private set; }
    public OrderStatus Status { get; private set; }
    public string? Note { get; private set; }
    
    public Guid? CustomerId { get; private set; }

    public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    protected Order() { }

    public Order(Guid tableSessionId, Guid? customerId, string? note)
    {
        TableSessionId = tableSessionId;
        CustomerId = customerId;
        Note = note;
        Status = OrderStatus.Created;
    }

    public void AddItem(OrderItem item)
    {
        OrderItems.Add(item);
        RecalculateTotal();
    }

    public void RecalculateTotal()
    {
        TotalAmount = OrderItems.Sum(x => x.TotalPrice);
    }

    public void UpdateStatus(OrderStatus newStatus)
    {
        Status = newStatus;
    }
}
