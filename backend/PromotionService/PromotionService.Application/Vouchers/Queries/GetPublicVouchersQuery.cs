using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record GetPublicVouchersQuery() : IRequest<List<VoucherDto>>;

public class GetPublicVouchersQueryHandler : IRequestHandler<GetPublicVouchersQuery, List<VoucherDto>>
{
    private readonly IAppDbContext _context;

    public GetPublicVouchersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<VoucherDto>> Handle(GetPublicVouchersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Vouchers
            .Where(v => v.IsActive && 
                        (v.ValidFrom == null || v.ValidFrom <= DateTime.UtcNow) && 
                        (v.ValidTo == null || v.ValidTo >= DateTime.UtcNow) && 
                        v.UsageCount < v.TotalUsageLimit)
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
                v.Conditions,
                v.MaxRedemptionsPerUser
            ))
            .ToListAsync(cancellationToken);
    }
}
