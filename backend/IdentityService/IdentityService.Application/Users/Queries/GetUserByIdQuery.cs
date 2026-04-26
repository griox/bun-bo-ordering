using MediatR;
using Microsoft.EntityFrameworkCore;
using IdentityService.Application.Interfaces;

namespace IdentityService.Application.Users.Queries;

public record GetUserByIdQuery(Guid Id) : IRequest<UserDto?>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDto?>
{
    private readonly IAppDbContext _context;

    public GetUserByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Where(u => u.Id == request.Id)
            .Select(u => new UserDto(u.Id, u.Username, u.Email, u.Role, u.IsBlacklisted, u.BlacklistReason, u.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return user;
    }
}
