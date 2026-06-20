using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record GetUserVouchersQuery(Guid UserId) : IRequest<List<UserVoucherDto>>;

public record UserVoucherDto(
    Guid Id,
    string Code,
    string Description,
    string Status, // "Unused", "Used", "Expired"
    DateTime? ExpiryDate,
    Guid VoucherId
);

public class GetUserVouchersQueryHandler : IRequestHandler<GetUserVouchersQuery, List<UserVoucherDto>>
{
    private readonly IAppDbContext _context;

    public GetUserVouchersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserVoucherDto>> Handle(GetUserVouchersQuery request, CancellationToken cancellationToken)
    {
        var userVouchers = await _context.UserVouchers.AsNoTracking()
            .Where(uv => uv.UserId == request.UserId)
            .Join(_context.Vouchers.AsNoTracking(), 
                uv => uv.VoucherId, 
                v => v.Id, 
                (uv, v) => new { uv, v })
            .Select(x => new UserVoucherDto(
                x.uv.Id,
                x.v.Code,
                x.v.Description,
                x.uv.IsUsed ? "Used" : (x.uv.ExpiryDate < DateTime.UtcNow ? "Expired" : "Unused"),
                x.uv.ExpiryDate,
                x.v.Id
            ))
            .ToListAsync(cancellationToken);

        return userVouchers;
    }
}
