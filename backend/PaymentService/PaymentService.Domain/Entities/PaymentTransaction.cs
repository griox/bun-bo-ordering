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
    public string? VoucherCode { get; private set; }
    public string? TableNumber { get; private set; }
    public Guid? TableSessionId { get; private set; }
    public string? PaymentUrl { get; private set; }
    public string? Note { get; private set; }

    protected PaymentTransaction() 
    { 
        Provider = null!;
    } // EF Core

    public PaymentTransaction(Guid orderId, decimal amount, string provider, Guid? customerId = null, string? paymentUrl = null, string? voucherCode = null, Guid? tableSessionId = null, string? tableNumber = null, string? note = null)
    {
        OrderId = orderId;
        Amount = amount;
        Provider = provider;
        CustomerId = customerId;
        PaymentUrl = paymentUrl;
        VoucherCode = voucherCode;
        TableSessionId = tableSessionId;
        TableNumber = tableNumber;
        Note = note;
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
