using System;
using BunBo.SharedKernel;
using PaymentService.Domain.Enums;

namespace PaymentService.Domain.Entities;

public class PaymentTransaction : BaseEntity
{
    public Guid OrderId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public decimal Amount { get; private set; }
    public string Provider { get; private set; }
    public string? TransactionId { get; private set; }
    public string? Signature { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? PaymentUrl { get; private set; }

    protected PaymentTransaction() { } // EF Core

    public PaymentTransaction(Guid orderId, decimal amount, string provider, Guid? customerId = null, string? paymentUrl = null)
    {
        OrderId = orderId;
        Amount = amount;
        Provider = provider;
        CustomerId = customerId;
        PaymentUrl = paymentUrl;
        Status = PaymentStatus.Pending;
    }

    public void MarkAsSuccess(string transactionId, string signature)
    {
        Status = PaymentStatus.Success;
        TransactionId = transactionId;
        Signature = signature;
    }

    public void MarkAsFailed()
    {
        Status = PaymentStatus.Failed;
    }
}
