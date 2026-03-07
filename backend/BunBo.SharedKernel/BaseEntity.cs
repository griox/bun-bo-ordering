namespace BunBo.SharedKernel;

public abstract class BaseEntity<TId>
{
    public TId Id { get; protected set; } = default!;
    
    // Audit fields (simplified for now)
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    public bool IsDeleted { get; protected set; } = false;
    public DateTime? DeletedAt { get; protected set; }

    public void MarkAsDeleted()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }
}

public abstract class BaseEntity : BaseEntity<Guid>
{
    protected BaseEntity()
    {
        Id = Guid.NewGuid();
    }
}
