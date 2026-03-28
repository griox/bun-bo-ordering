namespace BunBo.SharedKernel.Messaging;

public record OrderStatusUpdatedEvent
{
    public Guid OrderId { get; init; }
    public string NewStatus { get; init; } = string.Empty;
    public DateTime UpdatedAt { get; init; }
}
