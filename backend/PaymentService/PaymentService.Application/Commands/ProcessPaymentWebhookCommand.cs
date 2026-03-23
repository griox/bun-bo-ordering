using System;
using MediatR;

namespace PaymentService.Application.Commands;

public class ProcessPaymentWebhookCommand : IRequest<bool>
{
    public Guid OrderId { get; }
    public string ProviderTransactionId { get; }
    public decimal Amount { get; }
    public string Status { get; }
    public string Signature { get; }

    public ProcessPaymentWebhookCommand(Guid orderId, string providerTransactionId, decimal amount, string status, string signature)
    {
        OrderId = orderId;
        ProviderTransactionId = providerTransactionId;
        Amount = amount;
        Status = status;
        Signature = signature;
    }
}
