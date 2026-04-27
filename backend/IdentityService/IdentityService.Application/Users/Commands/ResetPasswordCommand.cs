using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace IdentityService.Application.Users.Commands;

public record ResetPasswordCommand(string Email, string OtpCode, string NewPassword) : IRequest;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IAppDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly IPasswordHasher<User> _passwordHasher;

    public ResetPasswordCommandHandler(IAppDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var cachedOtp = await _cache.GetStringAsync($"otp:{request.Email}", cancellationToken);

        if (cachedOtp == null || cachedOtp != request.OtpCode)
        {
            throw new Exception("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        
        if (user == null)
        {
            throw new Exception("Người dùng không tồn tại.");
        }

        // Update password
        var newHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatePassword(newHash);

        await _context.SaveChangesAsync(cancellationToken);

        // Delete OTP from cache after successful reset
        await _cache.RemoveAsync($"otp:{request.Email}", cancellationToken);
    }
}
