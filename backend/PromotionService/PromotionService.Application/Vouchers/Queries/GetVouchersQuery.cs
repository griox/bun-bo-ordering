using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record GetVouchersQuery(int Skip = 0, int Take = 50) : IRequest<VoucherListDto>;

public record VoucherListDto(List<VoucherDto> Items, int TotalCount);

public class GetVouchersQueryHandler : IRequestHandler<GetVouchersQuery, VoucherListDto>
{
    private readonly IAppDbContext _context;

    public GetVouchersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<VoucherListDto> Handle(GetVouchersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Vouchers.AsNoTracking();
        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
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

        return new VoucherListDto(items, totalCount);
    }
}
