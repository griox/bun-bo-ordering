using MediatR;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;

namespace PromotionService.Application.Vouchers.Commands;

public record CreateVoucherCommand(
    string Code,
    string Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscountAmount,
    decimal MinOrderValue,
    DateTime ValidFrom,
    DateTime ValidTo,
    int TotalUsageLimit,
    int MaxUsagePerUser
) : IRequest<Guid>;

public class CreateVoucherCommandHandler : IRequestHandler<CreateVoucherCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateVoucherCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateVoucherCommand request, CancellationToken cancellationToken)
    {
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
            request.MaxUsagePerUser
        );

        _context.Vouchers.Add(voucher);
        await _context.SaveChangesAsync(cancellationToken);

        return voucher.Id;
    }
}
