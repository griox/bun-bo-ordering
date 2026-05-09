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

    [Fact]
    public async Task Consume_EmailServiceFails_ShouldThrowException()
    {
        // Arrange
        var @event = new UserRegisteredEvent { Email = "test@example.com", Username = "user" };
        var contextMock = new Mock<ConsumeContext<UserRegisteredEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        _emailServiceMock.Setup(x => x.SendWelcomeEmailAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("SMTP Down"));

        // Act
        Func<Task> act = () => _consumer.Consume(contextMock.Object);

        // Assert
        // MassTransit consumers should throw so the message can be retried or moved to dead-letter queue
        await act.Should().ThrowAsync<Exception>().WithMessage("SMTP Down");
    }
}
