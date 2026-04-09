using MediatR;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Application.Vouchers.Dtos;

namespace PromotionService.Application.Vouchers.Queries;

public record GetUserLoyaltyPointsQuery(Guid UserId) : IRequest<LoyaltyPointDto?>;

public class GetUserLoyaltyPointsQueryHandler : IRequestHandler<GetUserLoyaltyPointsQuery, LoyaltyPointDto?>
{
    private readonly IAppDbContext _context;

    public GetUserLoyaltyPointsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<LoyaltyPointDto?> Handle(GetUserLoyaltyPointsQuery request, CancellationToken cancellationToken)
    {
        var loyalty = await _context.LoyaltyPoints
            .SingleOrDefaultAsync(lp => lp.UserId == request.UserId, cancellationToken);

        if (loyalty == null) return new LoyaltyPointDto(request.UserId, 0, new List<PointTransactionDto>());

        var transactions = await _context.PointTransactions
            .Where(t => t.UserId == request.UserId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new PointTransactionDto(
                t.Id,
                t.Points,
                t.Type,
                t.Reason,
                t.CreatedAt,
                t.OrderId
            ))
            .ToListAsync(cancellationToken);

        return new LoyaltyPointDto(loyalty.UserId, loyalty.TotalPoints, transactions);
    }
}
