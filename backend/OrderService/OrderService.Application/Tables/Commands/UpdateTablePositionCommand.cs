using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Tables.Commands;

public record UpdateTablePositionCommand(Guid Id, int PosX, int PosY) : IRequest<bool>;

public class UpdateTablePositionCommandHandler : IRequestHandler<UpdateTablePositionCommand, bool>
{
    private readonly IAppDbContext _db;

    public UpdateTablePositionCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(UpdateTablePositionCommand request, CancellationToken cancellationToken)
    {
        var table = await _db.RestaurantTables.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);
        if (table == null) return false;

        table.SetPosition(request.PosX, request.PosY);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
