using CatalogService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Food> Foods { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
