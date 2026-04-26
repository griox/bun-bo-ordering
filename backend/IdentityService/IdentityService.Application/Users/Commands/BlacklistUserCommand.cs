using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Users.Commands;

public record BlacklistUserCommand(Guid UserId, string Reason) : IRequest;

public class BlacklistUserCommandHandler : IRequestHandler<BlacklistUserCommand>
{
    private readonly IAppDbContext _context;

    public BlacklistUserCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(BlacklistUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null)
        {
            throw new Exception("User not found");
        }

        user.Blacklist(request.Reason);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
