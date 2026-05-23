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
        var orders = await _context.Orders
            .Include(o => o.TableSession)
            .ThenInclude(ts => ts!.Table)
            .Where(o => o.TableSession != null && o.TableSession.Table != null && o.TableSession.Table.TableCode == request.TableCode && o.IsRead == false)
            .ToListAsync(cancellationToken);

        if (!orders.Any())
        {
            return false;
        }

        foreach (var order in orders)
        {
            order.MarkAsRead();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
