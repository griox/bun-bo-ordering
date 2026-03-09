using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

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

    public GetTableQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetTableResponse> Handle(GetTableQuery request, CancellationToken cancellationToken)
    {
        var table = await _context.RestaurantTables
            .FirstOrDefaultAsync(t => t.Id == request.TableId, cancellationToken);
            
        if (table == null) return null!;

        return new GetTableResponse
        {
            Id = table.Id,
            TableCode = table.TableCode,
            Name = table.Name
        };
    }
}
