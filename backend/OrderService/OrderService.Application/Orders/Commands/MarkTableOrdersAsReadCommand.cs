using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;

namespace OrderService.Application.Orders.Commands;

public record MarkTableOrdersAsReadCommand(string TableCode) : IRequest<bool>;

public class MarkTableOrdersAsReadCommandHandler : IRequestHandler<MarkTableOrdersAsReadCommand, bool>
{
    private readonly IAppDbContext _context;

    public MarkTableOrdersAsReadCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(MarkTableOrdersAsReadCommand request, CancellationToken cancellationToken)
    {
        // Bulk UPDATE directly on the database to prevent high memory usage when updating ~2000 orders
        var affectedRows = await _context.Orders
            .Where(o => o.TableSession != null
                && o.TableSession.Table != null
                && o.TableSession.Table.TableCode == request.TableCode
                && o.IsRead == false)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(o => o.IsRead, true),
                cancellationToken);

        return affectedRows > 0;
    }
}
