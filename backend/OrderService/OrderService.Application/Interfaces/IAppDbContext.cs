using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Entities;

namespace OrderService.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<RestaurantTable> RestaurantTables { get; }
    DbSet<TableSession> TableSessions { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Payment> Payments { get; }
    DbSet<UserOrderPreference> UserOrderPreferences { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
