using BunBo.SharedKernel.Messaging;
using IdentityService.Domain.Entities;
using MassTransit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace IdentityService.Application.Consumers;

public class VoucherCreatedEventConsumer : IConsumer<VoucherCreatedEvent>
{
    private readonly IdentityService.Application.Interfaces.IAppDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<VoucherCreatedEventConsumer> _logger;

    public VoucherCreatedEventConsumer(
        IdentityService.Application.Interfaces.IAppDbContext context,
        IPublishEndpoint publishEndpoint,
        ILogger<VoucherCreatedEventConsumer> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VoucherCreatedEvent> context)
    {
        var voucher = context.Message;
        _logger.LogInformation("Received VoucherCreatedEvent for Voucher {VoucherCode}. Fetching users...", voucher.Code);

        // In a real production with 1M users, you'd want to paginate this.
        // For our demo/scale, fetching all users is acceptable.
        var users = await _context.Users.ToListAsync();

        foreach (var user in users)
        {
            if (string.IsNullOrEmpty(user.Email)) continue;

            await _publishEndpoint.Publish(new VoucherHuntNotificationEvent
            {
                Email = user.Email,
                Username = user.Username ?? "Khách hàng",
                Code = voucher.Code,
                Description = voucher.Description,
                DiscountValue = voucher.DiscountValue,
                DiscountType = voucher.DiscountType,
                TotalUsageLimit = voucher.TotalUsageLimit,
                ValidFrom = voucher.ValidFrom,
                ValidTo = voucher.ValidTo
            });
        }

        _logger.LogInformation("Published VoucherHuntNotificationEvent to {Count} users.", users.Count);
    }
}
