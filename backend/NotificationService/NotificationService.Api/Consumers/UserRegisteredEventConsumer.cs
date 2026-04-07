using BunBo.SharedKernel.Messaging;
using MassTransit;
using NotificationService.Api.Services;

namespace NotificationService.Api.Consumers;

public class UserRegisteredEventConsumer : IConsumer<UserRegisteredEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<UserRegisteredEventConsumer> _logger;

    public UserRegisteredEventConsumer(IEmailService emailService, ILogger<UserRegisteredEventConsumer> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserRegisteredEvent> context)
    {
        var @event = context.Message;
        _logger.LogInformation("Processing registration email for user: {Username} ({Email})", @event.Username, @event.Email);

        await _emailService.SendWelcomeEmailAsync(@event.Email, @event.Username);
    }
}
