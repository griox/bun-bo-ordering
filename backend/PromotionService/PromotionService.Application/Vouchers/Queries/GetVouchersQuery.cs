using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record GetVouchersQuery() : IRequest<List<VoucherDto>>;

public class GetVouchersQueryHandler : IRequestHandler<GetVouchersQuery, List<VoucherDto>>
{
    private readonly IAppDbContext _context;

    public GetVouchersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<VoucherDto>> Handle(GetVouchersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Vouchers
            .Select(v => new VoucherDto(
                v.Id,
                v.Code,
                v.Description,
                v.DiscountType,
                v.DiscountValue,
                v.MaxDiscountAmount,
                v.MinOrderValue,
                v.ValidFrom,
                v.ValidTo,
                v.TotalUsageLimit,
                v.UsageCount,
                v.MaxUsagePerUser,
                v.IsActive,
                v.Type,
                v.PointCost,
                v.Conditions
            ))
            .ToListAsync(cancellationToken);
    }
}
