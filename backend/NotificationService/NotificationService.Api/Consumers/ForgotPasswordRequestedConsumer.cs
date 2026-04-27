using BunBo.SharedKernel.Messaging;
using MassTransit;
using NotificationService.Api.Services;

namespace NotificationService.Api.Consumers;

public class ForgotPasswordRequestedConsumer : IConsumer<ForgotPasswordRequestedEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<ForgotPasswordRequestedConsumer> _logger;

    public ForgotPasswordRequestedConsumer(IEmailService emailService, ILogger<ForgotPasswordRequestedConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ForgotPasswordRequestedEvent> context)
    {
        var @event = context.Message;
        _logger.LogInformation("Processing forgot password email for user: {Username} ({Email})", @event.Username, @event.Email);

        await _emailService.SendForgotPasswordEmailAsync(@event.Email, @event.Username, @event.OtpCode);
    }
}
