using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationService.Api.Consumers;
using NotificationService.Api.Services;
using Xunit;

namespace NotificationService.UnitTests.Consumers;

public class UserRegisteredEventConsumerTests
{
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<UserRegisteredEventConsumer>> _loggerMock;
    private readonly UserRegisteredEventConsumer _consumer;

    public UserRegisteredEventConsumerTests()
    {
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<UserRegisteredEventConsumer>>();
        _consumer = new UserRegisteredEventConsumer(_emailServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldCallSendWelcomeEmailAsync_WithCorrectParameters()
    {
        // Arrange
        var @event = new UserRegisteredEvent
        {
            UserId = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            RegisteredAt = DateTime.UtcNow
        };

        var contextMock = new Mock<ConsumeContext<UserRegisteredEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _emailServiceMock.Verify(x => x.SendWelcomeEmailAsync(@event.Email, @event.Username), Times.Once);
    }
}
