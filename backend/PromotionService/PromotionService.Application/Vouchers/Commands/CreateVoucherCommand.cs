using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;

namespace PromotionService.Application.Vouchers.Commands;

public class CreateVoucherCommand : IRequest<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderValue { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public int TotalUsageLimit { get; set; }
    public int MaxUsagePerUser { get; set; }
    public VoucherType Type { get; set; }
    public int? PointCost { get; set; }
    public string? Conditions { get; set; }
}

public class CreateVoucherCommandHandler : IRequestHandler<CreateVoucherCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateVoucherCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateVoucherCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.ToUpper();
        if (await _context.Vouchers.AnyAsync(v => v.Code == normalizedCode, cancellationToken))
            throw new Exception("Mã giảm giá này đã tồn tại.");

        var voucher = new Voucher(
            request.Code,
            request.Description,
            request.DiscountType,
            request.DiscountValue,
            request.MaxDiscountAmount,
            request.MinOrderValue,
            request.ValidFrom,
            request.ValidTo,
            request.TotalUsageLimit,
            request.MaxUsagePerUser,
            request.Type,
            request.PointCost,
            request.Conditions
        );

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync(cancellationToken);

        return voucher.Id;
    }
}
