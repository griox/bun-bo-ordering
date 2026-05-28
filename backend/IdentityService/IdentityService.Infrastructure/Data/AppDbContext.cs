using IdentityService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

using IdentityService.Application.Interfaces;

namespace IdentityService.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public DbSet<User> Users { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired(false); // Nullable for OAuth
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.Property(e => e.GoogleId).IsRequired(false).HasMaxLength(150);
            entity.HasIndex(e => e.GoogleId).IsUnique(); // Ensure Google Ids are unique

            entity.HasMany(e => e.RefreshTokens)
                  .WithOne(e => e.User)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.Metadata.FindNavigation(nameof(User.RefreshTokens))?
                  .SetPropertyAccessMode(PropertyAccessMode.Field);
        });
    }
}
