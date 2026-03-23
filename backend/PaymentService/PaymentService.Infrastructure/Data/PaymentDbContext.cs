using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;
using System;

namespace PaymentService.Infrastructure.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options) { }

    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasConversion(
                v => v.ToString(),
                v => (PaymentStatus)Enum.Parse(typeof(PaymentStatus), v)
            );
            
            // Unique index to prevent processing the same webhook twice
            entity.HasIndex(e => e.TransactionId).IsUnique();
            // Fast lookup by OrderId
            entity.HasIndex(e => e.OrderId);
        });
    }

    public override System.Threading.Tasks.Task<int> SaveChangesAsync(System.Threading.CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BunBo.SharedKernel.BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Property(x => x.CreatedAt).CurrentValue = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Property(x => x.UpdatedAt).CurrentValue = DateTime.UtcNow;
                    break;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
