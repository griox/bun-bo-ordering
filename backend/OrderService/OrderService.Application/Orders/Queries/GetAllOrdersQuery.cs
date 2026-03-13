using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Orders.Queries;

public record GetAllOrdersQuery(int Skip = 0, int Take = 50) : IRequest<List<OrderSummaryDto>>;

public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, List<OrderSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetAllOrdersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderSummaryDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        return await _context.Orders
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.TableSession!.Table!.TableCode,
                o.TableSession.Table.Name,
                o.CreatedAt,
                o.TotalAmount,
                o.Status,
                o.Note
            ))
            .ToListAsync(cancellationToken);
    }
}
