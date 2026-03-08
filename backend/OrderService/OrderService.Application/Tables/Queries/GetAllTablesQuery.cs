using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.Tables.Queries;

public record GetAllTablesQuery() : IRequest<IEnumerable<RestaurantTable>>;

public class GetAllTablesQueryHandler : IRequestHandler<GetAllTablesQuery, IEnumerable<RestaurantTable>>
{
    private readonly IAppDbContext _db;

    public GetAllTablesQueryHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<RestaurantTable>> Handle(GetAllTablesQuery request, CancellationToken cancellationToken)
    {
        return await _db.RestaurantTables
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.TableCode)
            .ToListAsync(cancellationToken);
    }
}
