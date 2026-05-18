using BunBo.SharedKernel.Messaging;
using MassTransit;
using NotificationService.Api.Services;

namespace NotificationService.Api.Consumers;

public class VoucherHuntNotificationEventConsumer : IConsumer<VoucherHuntNotificationEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<VoucherHuntNotificationEventConsumer> _logger;

    public VoucherHuntNotificationEventConsumer(
        IEmailService emailService,
        ILogger<VoucherHuntNotificationEventConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<VoucherHuntNotificationEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Processing VoucherHuntNotificationEvent for {Email}", msg.Email);

        await _emailService.SendVoucherHuntEmailAsync(
            msg.Email, 
            msg.Username, 
            msg.Code, 
            msg.Description, 
            msg.DiscountValue, 
            msg.DiscountType, 
            msg.TotalUsageLimit, 
            msg.ValidFrom, 
            msg.ValidTo
        );
    }
}
