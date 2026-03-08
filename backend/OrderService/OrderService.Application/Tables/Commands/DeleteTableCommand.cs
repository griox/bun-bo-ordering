using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Tables.Commands;

public record DeleteTableCommand(Guid Id) : IRequest<bool>;

public class DeleteTableCommandHandler : IRequestHandler<DeleteTableCommand, bool>
{
    private readonly IAppDbContext _db;

    public DeleteTableCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(DeleteTableCommand request, CancellationToken cancellationToken)
    {
        var table = await _db.RestaurantTables.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);
        if (table == null) return false;

        table.MarkAsDeleted();
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
