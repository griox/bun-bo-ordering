using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using MassTransit;
using Moq;
using Moq.EntityFrameworkCore;
using Xunit;

namespace IdentityService.UnitTests.Auth;

public class RegisterCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _publishEndpointMock = new Mock<IPublishEndpoint>();
        _handler = new RegisterCommandHandler(_contextMock.Object, _publishEndpointMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldHashPasswordAndCreateUser()
    {
        // Arrange
        var command = new RegisterCommand("newuser", "new@example.com", "Password123!");
        _contextMock.Setup(x => x.Users).ReturnsDbSet(new List<User>());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.Users.Add(It.Is<User>(u => 
            u.Username == "newuser" && 
            u.Email == "new@example.com" && 
            u.PasswordHash != "Password123!")), Times.Once);
        
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _publishEndpointMock.Verify(x => x.Publish(It.IsAny<UserRegisteredEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_DuplicateUsername_ShouldThrowException()
    {
        // Arrange
        var existingUser = new User("existinguser", "old@example.com", "hash", "Client");
        _contextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { existingUser });

        var command = new RegisterCommand("existinguser", "new@example.com", "Password123!");

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Tên đăng nhập đã được sử dụng.");
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ShouldThrowException()
    {
        // Arrange
        var existingUser = new User("olduser", "duplicate@example.com", "hash", "Client");
        _contextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { existingUser });

        var command = new RegisterCommand("newuser", "duplicate@example.com", "Password123!");

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>().WithMessage("Email đã được đăng ký.");
    }
}
