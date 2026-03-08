using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.Tables.Commands;

public record CreateTableCommand(string TableCode, string Name) : IRequest<Guid>;

public class CreateTableCommandHandler : IRequestHandler<CreateTableCommand, Guid>
{
    private readonly IAppDbContext _db;

    public CreateTableCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateTableCommand request, CancellationToken cancellationToken)
    {
        if (await _db.RestaurantTables.AnyAsync(x => x.TableCode == request.TableCode && !x.IsDeleted, cancellationToken))
            throw new Exception("Bàn đã tồn tại.");

        var table = new RestaurantTable(request.TableCode, request.Name);
        _db.RestaurantTables.Add(table);
        await _db.SaveChangesAsync(cancellationToken);

        return table.Id;
    }
}
