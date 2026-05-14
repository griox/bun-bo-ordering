using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Application.Auth.Commands;

public record RevokeAllTokensCommand(Guid UserId) : IRequest<bool>;

public class RevokeAllTokensCommandHandler : IRequestHandler<RevokeAllTokensCommand, bool>
{
    private readonly IAppDbContext _dbContext;

    public RevokeAllTokensCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(RevokeAllTokensCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null) return false;

        user.RevokeRefreshToken();
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
