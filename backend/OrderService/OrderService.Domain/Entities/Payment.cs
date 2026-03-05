using BunBo.SharedKernel;
using OrderService.Domain.Enums;

namespace OrderService.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Order? Order { get; private set; }

    public decimal Amount { get; private set; }
    
    // System now focuses solely on sePay as default provider based on updated requirements
    public string Provider { get; private set; } = "sePay";
    public string? TransactionId { get; private set; }
    public string? Signature { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? PaymentUrl { get; private set; }

    protected Payment() { }

    public Payment(Guid orderId, decimal amount, string provider = "sePay")
    {
        OrderId = orderId;
        Amount = amount;
        Provider = provider;
        Status = PaymentStatus.Pending;
    }

    public void MarkAsSuccess(string transactionId)
    {
        Status = PaymentStatus.Success;
        TransactionId = transactionId;
    }

    public void MarkAsFailed()
    {
        Status = PaymentStatus.Failed;
    }
}
