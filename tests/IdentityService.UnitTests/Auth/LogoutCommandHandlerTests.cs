using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Moq;
using Moq.EntityFrameworkCore;
using FluentAssertions;
using MediatR;

namespace IdentityService.UnitTests.Auth;

public class LogoutCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly LogoutCommandHandler _handler;

    public LogoutCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new LogoutCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldRevokeRefreshToken_WhenUserExists()
    {
        // Arrange
        var user = new User("test", "test@test.com", "hash", "Client");
        var userId = user.Id;
        user.AddRefreshToken("valid-rt", DateTime.UtcNow.AddDays(1));

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new LogoutCommand(userId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        user.RefreshTokens.Should().BeEmpty();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldDoNothing_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User>());

        var command = new LogoutCommand(userId);

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
