using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using BunBo.SharedKernel.Messaging;
using MediatR;

namespace IdentityService.Application.Auth.Commands;

public record RegisterCommand(string Username, string Email, string Password) : IRequest<Guid>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IAppDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;

    public RegisterCommandHandler(IAppDbContext dbContext, IPublishEndpoint publishEndpoint)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Validate email format
        if (!System.Net.Mail.MailAddress.TryCreate(request.Email, out _))
            throw new Exception("Email không hợp lệ.");

        // Password validation
        var passwordRegex = new System.Text.RegularExpressions.Regex(@"^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$");
        if (!passwordRegex.IsMatch(request.Password))
            throw new Exception("Mật khẩu phải ít nhất 8 ký tự, có 1 chữ hoa và 1 ký tự đặc biệt.");

        if (await _dbContext.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
            throw new Exception("Tên đăng nhập đã được sử dụng.");

        if (await _dbContext.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            throw new Exception("Email đã được đăng ký.");

        var passwordHasher = new PasswordHasher<User>();
        var user = new User(request.Username, request.Email, "", "Client");
        var hash = passwordHasher.HashPassword(user, request.Password);
        user.UpdatePassword(hash);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Publish event
        await _publishEndpoint.Publish(new UserRegisteredEvent
        {
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            RegisteredAt = DateTime.UtcNow
        }, cancellationToken);

        return user.Id;
    }
}
