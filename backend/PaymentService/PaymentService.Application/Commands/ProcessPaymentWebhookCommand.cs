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

    /// <summary>
    /// When true, the webhook was already authenticated via API Key in the controller.
    /// The HMAC signature check in the handler will be skipped.
    /// </summary>
    public bool IsApiKeyVerified { get; }

    public ProcessPaymentWebhookCommand(Guid orderId, string providerTransactionId, decimal amount, string status, string signature, bool isApiKeyVerified = false)
    {
        OrderId = orderId;
        ProviderTransactionId = providerTransactionId;
        Amount = amount;
        Status = status;
        Signature = signature;
        IsApiKeyVerified = isApiKeyVerified;
    }
}
