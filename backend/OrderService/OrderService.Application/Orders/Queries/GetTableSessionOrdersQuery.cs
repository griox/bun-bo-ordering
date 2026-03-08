using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.Orders.Queries;

public record GetTableSessionOrdersQuery(Guid TableSessionId) : IRequest<List<Order>>;

public class GetTableSessionOrdersQueryHandler : IRequestHandler<GetTableSessionOrdersQuery, List<Order>>
{
    private readonly IAppDbContext _context;

    public GetTableSessionOrdersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Order>> Handle(GetTableSessionOrdersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.TableSessionId == request.TableSessionId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
