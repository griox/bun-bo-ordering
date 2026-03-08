namespace BunBo.SharedKernel.Messaging;

public record OrderCreatedEvent
{
    public Guid OrderId { get; init; }
    public Guid TableSessionId { get; init; }
    public decimal TotalAmount { get; init; }
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}
