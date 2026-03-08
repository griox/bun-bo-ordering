using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Tables.Commands;

public record UpdateTableCommand(Guid Id, string TableCode, string Name) : IRequest<bool>;

public class UpdateTableCommandHandler : IRequestHandler<UpdateTableCommand, bool>
{
    private readonly IAppDbContext _db;

    public UpdateTableCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> Handle(UpdateTableCommand request, CancellationToken cancellationToken)
    {
        var table = await _db.RestaurantTables.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);
        if (table == null) return false;

        // Check if the new TableCode is already taken by another table
        if (await _db.RestaurantTables.AnyAsync(x => x.Id != request.Id && x.TableCode == request.TableCode && !x.IsDeleted, cancellationToken))
            throw new Exception("Mã bàn đã tồn tại trên một bàn khác.");

        table.UpdateDetails(request.TableCode, request.Name);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
