using BunBo.SharedKernel;
using OrderService.Domain.Enums;

namespace OrderService.Domain.Entities;

public class Order : BaseEntity
{
    public Guid TableSessionId { get; private set; }
    public TableSession? TableSession { get; private set; }

    public decimal TotalAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public string? VoucherCode { get; private set; }
    public OrderStatus Status { get; private set; }
    public string? Note { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty;
    public bool IsRead { get; private set; } = false;
    
    public Guid? CustomerId { get; private set; }

    public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    protected Order() { }

    public Order(Guid tableSessionId, Guid? customerId, string? note, string paymentMethod, string? voucherCode = null, decimal discountAmount = 0)
    {
        if (customerId == null && !string.IsNullOrEmpty(voucherCode))
        {
            throw new DomainException("Khách vãng lai không được phép sử dụng voucher.");
        }
        TableSessionId = tableSessionId;
        CustomerId = customerId;
        Note = note;
        PaymentMethod = paymentMethod;
        VoucherCode = voucherCode;
        DiscountAmount = discountAmount;
        Status = OrderStatus.Processing;
    }

    public void AddItem(OrderItem item)
    {
        OrderItems.Add(item);
        RecalculateTotal();
    }

    public void RecalculateTotal()
    {
        var itemsTotal = OrderItems.Sum(x => x.TotalPrice);
        TotalAmount = Math.Max(0, itemsTotal - DiscountAmount);

        if (TotalAmount == 0)
        {
            Status = OrderStatus.Paid;
        }
    }

    public void UpdateStatus(OrderStatus newStatus)
    {
        if (Status == OrderStatus.Paid && newStatus == OrderStatus.Unpaid)
        {
            throw new DomainException("Cannot change status back to Unpaid once it is Paid.");
        }
        
        Status = newStatus;
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}
