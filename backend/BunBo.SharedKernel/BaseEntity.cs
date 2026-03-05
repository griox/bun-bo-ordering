namespace BunBo.SharedKernel;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; }
    
    // Audit fields (simplified for now)
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }
}
