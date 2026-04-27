using BunBo.SharedKernel.Messaging;
using IdentityService.Application.Interfaces;
using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace IdentityService.Application.Users.Commands;

public record ForgotPasswordCommand(string Email) : IRequest;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IAppDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly IPublishEndpoint _publishEndpoint;

    public ForgotPasswordCommandHandler(IAppDbContext context, IDistributedCache cache, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _cache = cache;
        _publishEndpoint = publishEndpoint;
    }

    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        
        if (user == null)
        {
            // For security, we don't disclose if user exists, but we won't send email
            return;
        }

        // Generate 6-digit OTP
        var otpCode = new Random().Next(100000, 999999).ToString();

        // Store in Redis with 5 minutes expiration
        var cacheOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        
        await _cache.SetStringAsync($"otp:{request.Email}", otpCode, cacheOptions, cancellationToken);

        // Publish event to send email
        await _publishEndpoint.Publish(new ForgotPasswordRequestedEvent
        {
            Email = user.Email,
            Username = user.Username,
            OtpCode = otpCode
        }, cancellationToken);
    }
}
