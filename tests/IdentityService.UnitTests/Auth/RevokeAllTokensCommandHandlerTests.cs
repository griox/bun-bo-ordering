using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Moq;
using Moq.EntityFrameworkCore;
using FluentAssertions;

namespace IdentityService.UnitTests.Auth;

public class RevokeAllTokensCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly RevokeAllTokensCommandHandler _handler;

    public RevokeAllTokensCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _handler = new RevokeAllTokensCommandHandler(_dbContextMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnTrue_WhenUserExistsAndRevoked()
    {
        // Arrange
        var user = new User("admin", "admin@test.com", "hash", "Admin");
        var userId = user.Id;
        user.AddRefreshToken("valid-rt", DateTime.UtcNow.AddDays(1));

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new RevokeAllTokensCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        user.RefreshTokens.Should().BeEmpty();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFalse_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User>());

        var command = new RevokeAllTokensCommand(userId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
