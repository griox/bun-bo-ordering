using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record ValidateVoucherQuery(string Code, Guid UserId, decimal OrderAmount) : IRequest<VoucherValidationResult>;

public record VoucherValidationResult(bool IsValid, string? Message, decimal? DiscountAmount = null);

public class ValidateVoucherQueryHandler : IRequestHandler<ValidateVoucherQuery, VoucherValidationResult>
{
    private readonly IAppDbContext _context;

    public ValidateVoucherQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<VoucherValidationResult> Handle(ValidateVoucherQuery request, CancellationToken cancellationToken)
    {
        var voucher = await _context.Vouchers
            .SingleOrDefaultAsync(v => v.Code == request.Code.ToUpper(), cancellationToken);

        if (voucher == null)
            return new VoucherValidationResult(false, "Mã giảm giá không tồn tại.");

        var userVoucher = await _context.UserVouchers
            .FirstOrDefaultAsync(uv => uv.UserId == request.UserId && uv.VoucherId == voucher.Id && !uv.IsUsed, cancellationToken);

        if (voucher.Type == Domain.Enums.VoucherType.PointRedemption && userVoucher == null)
            return new VoucherValidationResult(false, "Bạn phải đổi điểm lấy mã này trước khi sử dụng.");

        if (userVoucher != null && userVoucher.ExpiryDate.HasValue && DateTime.UtcNow > userVoucher.ExpiryDate.Value)
            return new VoucherValidationResult(false, "Mã giảm giá đã hết hạn sử dụng (7 ngày kể từ lúc đổi).");

        var userUsageCount = await _context.UserVouchers.CountAsync(uv => uv.UserId == request.UserId && uv.VoucherId == voucher.Id && uv.IsUsed, cancellationToken);
        if (!voucher.CanBeUsed(request.OrderAmount, request.UserId, userUsageCount))
        {
            if (!voucher.IsActive) return new VoucherValidationResult(false, "Mã giảm giá đã bị tạm ngừng.");
            if (DateTime.UtcNow < voucher.ValidFrom) return new VoucherValidationResult(false, "Mã giảm giá chưa đến ngày sử dụng.");
            if (DateTime.UtcNow > voucher.ValidTo) return new VoucherValidationResult(false, "Mã giảm giá đã hết hạn.");
            if (request.OrderAmount < voucher.MinOrderValue) return new VoucherValidationResult(false, $"Mã này chỉ áp dụng cho đơn từ {voucher.MinOrderValue:N0}đ.");
            if (voucher.UsageCount >= voucher.TotalUsageLimit) return new VoucherValidationResult(false, "Mã giảm giá đã hết lượt sử dụng.");
            if (userUsageCount >= voucher.MaxUsagePerUser) return new VoucherValidationResult(false, "Bạn đã dùng hết lượt cho mã này.");
            
            return new VoucherValidationResult(false, "Không đủ điều kiện sử dụng mã này.");
        }

        // Calculate Discount
        decimal discountAmount = 0;
        if (voucher.DiscountType == Domain.Enums.DiscountType.FixedAmount)
        {
            discountAmount = voucher.DiscountValue;
        }
        else
        {
            discountAmount = request.OrderAmount * (voucher.DiscountValue / 100);
            if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount.Value)
            {
                discountAmount = voucher.MaxDiscountAmount.Value;
            }
        }

        return new VoucherValidationResult(true, "Mã hợp lệ", discountAmount);
    }
}
