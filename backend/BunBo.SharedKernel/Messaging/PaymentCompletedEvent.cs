using System;

namespace BunBo.SharedKernel.Messaging;

public record PaymentCompletedEvent
{
    public Guid OrderId { get; init; }
    public Guid? CustomerId { get; init; }
    public string TransactionId { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public bool IsSuccess { get; init; }
    public DateTime CompletedAt { get; init; }
}
