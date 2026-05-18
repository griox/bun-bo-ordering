using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using MassTransit;
using BunBo.SharedKernel.Messaging;

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
    public int MaxRedemptionsPerUser { get; set; } = 1;
    public VoucherType Type { get; set; }
    public int? PointCost { get; set; }
    public string? Conditions { get; set; }
}

public class CreateVoucherCommandHandler : IRequestHandler<CreateVoucherCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;

    public CreateVoucherCommandHandler(IAppDbContext context, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
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
            request.Conditions,
            request.MaxRedemptionsPerUser
        );

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync(cancellationToken);

        if (voucher.Type == VoucherType.Standard)
        {
            await _publishEndpoint.Publish(new VoucherCreatedEvent
            {
                VoucherId = voucher.Id,
                Code = voucher.Code,
                Description = voucher.Description,
                DiscountValue = voucher.DiscountValue,
                DiscountType = (int)voucher.DiscountType,
                TotalUsageLimit = voucher.TotalUsageLimit,
                ValidFrom = voucher.ValidFrom,
                ValidTo = voucher.ValidTo
            }, cancellationToken);
        }

        return voucher.Id;
    }
}
