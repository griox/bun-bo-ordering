using MediatR;
using Microsoft.EntityFrameworkCore;
using IdentityService.Application.Interfaces;

namespace IdentityService.Application.Users.Queries;

public record UserDto(Guid Id, string Username, string Email, string Role, DateTime CreatedAt);

public record PagedResult<T>(List<T> Items, int TotalCount, int PageNumber, int PageSize);

public record GetAllUsersQuery(int PageNumber = 1, int PageSize = 10, string? SearchTerm = null) : IRequest<PagedResult<UserDto>>;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, PagedResult<UserDto>>
{
    private readonly IAppDbContext _context;

    public GetAllUsersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<UserDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.ToLower();
            query = query.Where(u => u.Username.ToLower().Contains(searchTerm) || u.Email.ToLower().Contains(searchTerm));
        }
        
        var totalCount = await query.CountAsync(cancellationToken);
        
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserDto(u.Id, u.Username, u.Email, u.Role, u.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>(users, totalCount, request.PageNumber, request.PageSize);
    }
}
