using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Enums;

namespace PromotionService.Application.Vouchers.Commands;

public class UpdateVoucherCommand : IRequest<bool>
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderValue { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int TotalUsageLimit { get; set; }
    public int MaxUsagePerUser { get; set; }
    public int MaxRedemptionsPerUser { get; set; }
    public bool IsActive { get; set; }
    public VoucherType Type { get; set; }
    public int? PointCost { get; set; }
    public string? Conditions { get; set; }
}

public class UpdateVoucherCommandHandler : IRequestHandler<UpdateVoucherCommand, bool>
{
    private readonly IAppDbContext _context;

    public UpdateVoucherCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateVoucherCommand request, CancellationToken cancellationToken)
    {
        var voucher = await _context.Vouchers.FindAsync(new object[] { request.Id }, cancellationToken);
        if (voucher == null) return false;

        voucher.Update(
            request.Description,
            request.DiscountType,
            request.DiscountValue,
            request.MaxDiscountAmount,
            request.MinOrderValue,
            request.ValidFrom,
            request.ValidTo,
            request.TotalUsageLimit,
            request.MaxUsagePerUser,
            request.IsActive,
            request.Type,
            request.PointCost,
            request.Conditions,
            request.MaxRedemptionsPerUser
        );

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
