using Microsoft.EntityFrameworkCore;
using PromotionService.Domain.Entities;

namespace PromotionService.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Voucher> Vouchers { get; }
    DbSet<UserVoucher> UserVouchers { get; }
    DbSet<LoyaltyPoint> LoyaltyPoints { get; }
    DbSet<PointTransaction> PointTransactions { get; }
    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
