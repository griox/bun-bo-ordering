using IdentityService.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace IdentityService.Application.Users.Commands;

public record VerifyOtpCommand(string Email, string OtpCode) : IRequest<bool>;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, bool>
{
    private readonly IDistributedCache _cache;

    public VerifyOtpCommandHandler(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<bool> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        var cachedOtp = await _cache.GetStringAsync($"otp:{request.Email}", cancellationToken);

        if (cachedOtp == null || cachedOtp != request.OtpCode)
        {
            return false;
        }

        return true;
    }
}
