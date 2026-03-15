using MediatR;
using OrderService.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace OrderService.Application.Tables.Commands;

public record TablePositionUpdate(Guid Id, int PosX, int PosY);

public record UpdateTablePositionsCommand(List<TablePositionUpdate> Updates) : IRequest<bool>;

public class UpdateTablePositionsCommandHandler : IRequestHandler<UpdateTablePositionsCommand, bool>
{
    private readonly IAppDbContext _db;

    public UpdateTablePositionsCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(UpdateTablePositionsCommand request, CancellationToken cancellationToken)
    {
        var ids = request.Updates.Select(u => u.Id).ToList();
        var tables = await _db.RestaurantTables
            .Where(t => ids.Contains(t.Id) && !t.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var table in tables)
        {
            var update = request.Updates.FirstOrDefault(u => u.Id == table.Id);
            if (update != null)
            {
                table.SetPosition(update.PosX, update.PosY);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
