using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using IdentityService.Application.Interfaces;
using IdentityService.Application.Users.Commands;
using IdentityService.Domain.Entities;
using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using Moq;
using Moq.EntityFrameworkCore;
using Xunit;

namespace IdentityService.UnitTests.Users;

public class ForgotPasswordCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IDistributedCache> _cacheMock;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly ForgotPasswordCommandHandler _handler;

    public ForgotPasswordCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _cacheMock = new Mock<IDistributedCache>();
        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _handler = new ForgotPasswordCommandHandler(_contextMock.Object, _cacheMock.Object, _publishEndpointMock.Object);
    }

    [Fact]
    public async Task Handle_UserExists_ShouldGenerateOtpAndPublishEvent()
    {
        // Arrange
        var email = "test@example.com";
        var user = new User("testuser", email, "hash", "Client");
        _contextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new ForgotPasswordCommand(email);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _cacheMock.Verify(x => x.SetAsync(
            It.Is<string>(s => s == $"otp:{email}"),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);

        _publishEndpointMock.Verify(x => x.Publish(It.Is<ForgotPasswordRequestedEvent>(e => 
            e.Email == email && 
            e.Username == "testuser" && 
            e.OtpCode.Length == 6), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_UserNotFound_ShouldDoNothing()
    {
        // Arrange
        _contextMock.Setup(x => x.Users).ReturnsDbSet(new List<User>());
        var command = new ForgotPasswordCommand("nonexistent@example.com");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _cacheMock.Verify(x => x.SetAsync(
            It.IsAny<string>(),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Never);

        _publishEndpointMock.Verify(x => x.Publish(
            It.IsAny<ForgotPasswordRequestedEvent>(), 
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
