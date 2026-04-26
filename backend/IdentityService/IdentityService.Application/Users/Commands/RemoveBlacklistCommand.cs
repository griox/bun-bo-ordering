using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Users.Commands;

public record RemoveBlacklistCommand(Guid UserId) : IRequest;

public class RemoveBlacklistCommandHandler : IRequestHandler<RemoveBlacklistCommand>
{
    private readonly IAppDbContext _context;

    public RemoveBlacklistCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(RemoveBlacklistCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null)
        {
            throw new Exception("User not found");
        }

        user.RemoveBlacklist();
        await _context.SaveChangesAsync(cancellationToken);
    }
}
