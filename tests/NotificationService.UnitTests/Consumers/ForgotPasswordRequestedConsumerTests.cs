using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.Extensions.Logging;
using Moq;
using NotificationService.Api.Consumers;
using NotificationService.Api.Services;
using Xunit;

namespace NotificationService.UnitTests.Consumers;

public class ForgotPasswordRequestedConsumerTests
{
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<ILogger<ForgotPasswordRequestedConsumer>> _loggerMock;
    private readonly ForgotPasswordRequestedConsumer _consumer;

    public ForgotPasswordRequestedConsumerTests()
    {
        _emailServiceMock = new Mock<IEmailService>();
        _loggerMock = new Mock<ILogger<ForgotPasswordRequestedConsumer>>();
        _consumer = new ForgotPasswordRequestedConsumer(_emailServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldCallSendForgotPasswordEmailAsync_WithCorrectParameters()
    {
        // Arrange
        var @event = new ForgotPasswordRequestedEvent
        {
            Username = "testuser",
            Email = "test@example.com",
            OtpCode = "123456"
        };

        var contextMock = new Mock<ConsumeContext<ForgotPasswordRequestedEvent>>();
        contextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(contextMock.Object);

        // Assert
        _emailServiceMock.Verify(x => x.SendForgotPasswordEmailAsync(@event.Email, @event.Username, @event.OtpCode), Times.Once);
    }
}
