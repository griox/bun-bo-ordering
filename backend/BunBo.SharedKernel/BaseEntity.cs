namespace BunBo.SharedKernel;

public abstract class BaseEntity
{
    public Guid Id { get; protected set; }
    
    // Audit fields (simplified for now)
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public bool IsDeleted { get; protected set; } = false;
    public DateTime? DeletedAt { get; protected set; }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }

    public void MarkAsDeleted()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }
}
