using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace OrderService.Application.TableSessions.Queries;

public class GetTableQuery : IRequest<GetTableResponse>
{
    public Guid TableId { get; set; }
}

public class GetTableResponse
{
    public Guid Id { get; set; }
    public string TableCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class GetTableQueryHandler : IRequestHandler<GetTableQuery, GetTableResponse>
{
    private readonly IAppDbContext _context;
    private readonly IMemoryCache _cache;

    public GetTableQueryHandler(IAppDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<GetTableResponse> Handle(GetTableQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"table_data_{request.TableId}";
        if (!_cache.TryGetValue(cacheKey, out GetTableResponse? tableData))
        {
            var table = await _context.RestaurantTables
                .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);
                
            if (table == null) return null!;

            tableData = new GetTableResponse
            {
                Id = table.Id,
                TableCode = table.TableCode,
                Name = table.Name
            };

            _cache.Set(cacheKey, tableData, TimeSpan.FromMinutes(30));
        }

        return tableData!;
    }
}
