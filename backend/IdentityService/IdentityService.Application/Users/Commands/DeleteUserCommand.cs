using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityService.Application.Users.Commands;

public record DeleteUserCommand(Guid UserId) : IRequest;

public class DeleteUserCommandHandler : IRequestHandler<DeleteUserCommand>
{
    private readonly IAppDbContext _context;
    private readonly Microsoft.Extensions.Logging.ILogger<DeleteUserCommandHandler> _logger;

    public DeleteUserCommandHandler(IAppDbContext context, Microsoft.Extensions.Logging.ILogger<DeleteUserCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Attempting to delete user with ID: {UserId}", request.UserId);
        
        try 
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                _logger.LogWarning("User with ID: {UserId} not found for deletion", request.UserId);
                throw new Exception("User not found");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Successfully deleted user with ID: {UserId}", request.UserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while deleting user with ID: {UserId}", request.UserId);
            throw;
        }
    }
}
