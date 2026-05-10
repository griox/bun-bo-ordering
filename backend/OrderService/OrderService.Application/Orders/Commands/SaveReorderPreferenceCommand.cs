using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Interfaces;
using OrderService.Domain.Entities;

namespace OrderService.Application.Orders.Commands;

public record SaveReorderPreferenceCommand(Guid UserId, Guid PreferredOrderId) : IRequest;

public class SaveReorderPreferenceCommandHandler : IRequestHandler<SaveReorderPreferenceCommand>
{
    private readonly IAppDbContext _context;
    public SaveReorderPreferenceCommandHandler(IAppDbContext context) => _context = context;

    public async Task Handle(SaveReorderPreferenceCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.UserOrderPreferences
            .FirstOrDefaultAsync(p => p.UserId == request.UserId, cancellationToken);

        if (existing is null)
        {
            _context.UserOrderPreferences.Add(
                new UserOrderPreference(request.UserId, request.PreferredOrderId));
        }
        else
        {
            existing.UpdatePreferredOrder(request.PreferredOrderId);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
