using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;
using PromotionService.Domain.Entities;

namespace PromotionService.Application.Vouchers.Queries;

public record ValidateVoucherQuery(string Code, Guid UserId, decimal OrderAmount) : IRequest<VoucherValidationResult>;

public record VoucherValidationResult(bool IsValid, string? Message, decimal? DiscountAmount = null, bool IsConflict = false);

public class ValidateVoucherQueryHandler : IRequestHandler<ValidateVoucherQuery, VoucherValidationResult>
{
    private readonly IAppDbContext _context;

    public ValidateVoucherQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<VoucherValidationResult> Handle(ValidateVoucherQuery request, CancellationToken cancellationToken)
    {
        var upperVoucherCode = request.Code.ToUpper();
        
        var voucher = await _context.Vouchers
            .SingleOrDefaultAsync(v => v.Code == upperVoucherCode, cancellationToken);

        if (voucher == null)
            return new VoucherValidationResult(false, "Mã giảm giá không tồn tại.");

        Voucher activeVoucher = voucher!;

        var userVoucher = await _context.UserVouchers
            .FirstOrDefaultAsync(uv => uv.UserId == request.UserId && uv.VoucherId == activeVoucher.Id && !uv.IsUsed, cancellationToken);

        if (activeVoucher.Type == Domain.Enums.VoucherType.PointRedemption && userVoucher == null)
            return new VoucherValidationResult(false, "Bạn phải đổi điểm lấy mã này trước khi sử dụng.");

        if (userVoucher != null && userVoucher.ExpiryDate.HasValue && DateTime.UtcNow > userVoucher.ExpiryDate.Value)
            return new VoucherValidationResult(false, "Mã giảm giá đã hết hạn sử dụng (7 ngày kể từ lúc đổi).");

        var userUsageCount = await _context.UserVouchers.CountAsync(uv => uv.UserId == request.UserId && uv.VoucherId == activeVoucher.Id && uv.IsUsed, cancellationToken);
        if (!activeVoucher.CanBeUsed(request.OrderAmount, request.UserId, userUsageCount))
        {
            if (!activeVoucher.IsActive) return new VoucherValidationResult(false, "Mã giảm giá đã bị tạm ngừng.");
            if (DateTime.UtcNow < activeVoucher.ValidFrom) return new VoucherValidationResult(false, "Mã giảm giá chưa đến ngày sử dụng.");
            if (DateTime.UtcNow > activeVoucher.ValidTo) return new VoucherValidationResult(false, "Mã giảm giá đã hết hạn.");
            if (request.OrderAmount < activeVoucher.MinOrderValue) return new VoucherValidationResult(false, $"Mã này chỉ áp dụng cho đơn từ {activeVoucher.MinOrderValue:N0}đ.");
            if (activeVoucher.UsageCount >= activeVoucher.TotalUsageLimit) return new VoucherValidationResult(false, "Mã giảm giá đã hết lượt sử dụng.", null, true);
            if (userUsageCount >= activeVoucher.MaxUsagePerUser) return new VoucherValidationResult(false, "Bạn đã dùng hết lượt cho mã này.", null, true);
            
            return new VoucherValidationResult(false, "Không đủ điều kiện sử dụng mã này.");
        }

        // Calculate Discount
        decimal discountAmount = 0;
        if (activeVoucher.DiscountType == Domain.Enums.DiscountType.FixedAmount)
        {
            discountAmount = activeVoucher.DiscountValue;
        }
        else
        {
            discountAmount = request.OrderAmount * (activeVoucher.DiscountValue / 100);
            if (activeVoucher.MaxDiscountAmount.HasValue && discountAmount > activeVoucher.MaxDiscountAmount.Value)
            {
                discountAmount = activeVoucher.MaxDiscountAmount.Value;
            }
        }

        return new VoucherValidationResult(true, "Mã hợp lệ", discountAmount);
    }
}
