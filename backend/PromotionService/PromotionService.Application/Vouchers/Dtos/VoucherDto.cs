using PromotionService.Domain.Enums;

namespace PromotionService.Application.Vouchers.Dtos;

public record VoucherDto(
    Guid Id,
    string Code,
    string Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountAmount,
    decimal MinOrderValue,
    DateTime? ValidFrom,
    DateTime? ValidTo,
    int TotalUsageLimit,
    int UsageCount,
    int MaxUsagePerUser,
    bool IsActive,
    VoucherType Type,
    int? PointCost,
    string? Conditions
);
