namespace BunBo.SharedKernel.Messaging;

public record OrderStatusUpdatedEvent
{
    public Guid OrderId { get; init; }
    public Guid? CustomerId { get; init; }
    public Guid TableSessionId { get; init; }
    public string NewStatus { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public DateTime UpdatedAt { get; init; }
}
