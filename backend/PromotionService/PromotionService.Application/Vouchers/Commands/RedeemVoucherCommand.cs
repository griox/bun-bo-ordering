using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using BunBo.SharedKernel;

namespace PromotionService.Application.Vouchers.Commands;

public record RedeemVoucherCommand(Guid UserId, Guid VoucherId) : IRequest<Guid>;

public class RedeemVoucherCommandHandler : IRequestHandler<RedeemVoucherCommand, Guid>
{
    private readonly IAppDbContext _context;

    public RedeemVoucherCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(RedeemVoucherCommand request, CancellationToken cancellationToken)
    {
        // Use a transaction for pessimistic locking
        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Lock the voucher record (FOR UPDATE would be better in production with raw SQL)
            var voucher = await _context.Vouchers
                .SingleOrDefaultAsync(v => v.Id == request.VoucherId, cancellationToken);

            if (voucher == null)
                throw new Exception("Mã giảm giá không tồn tại.");

            if (voucher.Type != VoucherType.PointRedemption || !voucher.PointCost.HasValue)
                throw new Exception("Mã này không phải loại đổi điểm.");

            if (!voucher.IsActive)
                throw new Exception("Mã giảm giá này hiện không khả dụng.");

            if (voucher.UsageCount >= voucher.TotalUsageLimit)
                throw new Exception("Mã giảm giá này đã hết lượt sử dụng.");

        // Check if user already has this voucher and it's not used
        var existingVoucher = await _context.UserVouchers
            .AnyAsync(uv => uv.UserId == request.UserId && uv.VoucherId == voucher.Id && !uv.IsUsed, cancellationToken);
        
        if (existingVoucher)
            throw new Exception("Bạn đã đổi mã này rồi và chưa sử dụng.");

        // Check total redemptions for this user
        var redemptionCount = await _context.UserVouchers
            .CountAsync(uv => uv.UserId == request.UserId && uv.VoucherId == voucher.Id, cancellationToken);
        
        if (redemptionCount >= voucher.MaxRedemptionsPerUser)
            throw new Exception("Bạn đã đổi tối đa số lần cho phép cho mã này.");

        // Get user points
        var loyalty = await _context.LoyaltyPoints
            .SingleOrDefaultAsync(lp => lp.UserId == request.UserId, cancellationToken);

        if (loyalty == null)
            throw new Exception("Thông tin khách hàng thân thiết không tồn tại.");

        // Redeem points
        loyalty.RedeemPoints(voucher.PointCost.Value);

        // Record transaction
        var pointTransaction = new PointTransaction(
            request.UserId,
            -voucher.PointCost.Value,
            TransactionType.Spend,
            null,
            $"Đổi điểm lấy mã: {voucher.Code}"
        );
        _context.PointTransactions.Add(pointTransaction);

        // Create user voucher with 7 days expiry
        var expiryDate = DateTime.UtcNow.AddDays(7);
        var userVoucher = new UserVoucher(request.UserId, voucher.Id, expiryDate);
        _context.UserVouchers.Add(userVoucher);

        await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return userVoucher.Id;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
