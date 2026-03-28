using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Domain.Enums;

namespace OrderService.Application.Orders.Queries;

public record GetAllOrdersQuery(int Skip = 0, int Take = 50, OrderStatus? Status = null) : IRequest<List<OrderSummaryDto>>;

public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, List<OrderSummaryDto>>
{
    private readonly IAppDbContext _context;

    public GetAllOrdersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderSummaryDto>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders
            .Include(o => o.TableSession)
                .ThenInclude(ts => ts!.Table)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        return await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.TableCode : "N/A",
                o.TableSession != null && o.TableSession.Table != null ? o.TableSession.Table.Name : "Unknown Table",
                o.CreatedAt,
                o.TotalAmount,
                o.Status,
                o.Note
            ))
            .ToListAsync(cancellationToken);
    }
}
