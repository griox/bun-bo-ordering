using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Auth.Commands;

public record LogoutCommand(Guid UserId) : IRequest<Unit>;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Unit>
{
    private readonly IAppDbContext _dbContext;

    public LogoutCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Unit> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user != null)
        {
            user.RevokeRefreshToken();
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        return Unit.Value;
    }
}
