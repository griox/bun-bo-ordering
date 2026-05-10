using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Orders.Queries;

public record GetReorderPreferenceQuery(Guid UserId) : IRequest<Guid?>;

public class GetReorderPreferenceQueryHandler : IRequestHandler<GetReorderPreferenceQuery, Guid?>
{
    private readonly IAppDbContext _context;
    public GetReorderPreferenceQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Guid?> Handle(GetReorderPreferenceQuery request, CancellationToken cancellationToken)
    {
        var pref = await _context.UserOrderPreferences
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);
        return pref?.PreferredOrderId;
    }
}
