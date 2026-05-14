using BunBo.SharedKernel;
using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Moq;
using Moq.EntityFrameworkCore;
using FluentAssertions;

namespace IdentityService.UnitTests.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _tokenServiceMock = new Mock<ITokenService>();
        _handler = new RefreshTokenCommandHandler(_dbContextMock.Object, _tokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenTokenIsExpired()
    {
        // Arrange
        var user = new User("test", "test@test.com", "hash", "Client");
        user.UpdateRefreshToken("old-rt", DateTime.UtcNow.AddHours(-1)); // Expired

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new RefreshTokenCommand("fake-at", "old-rt");

        // Act & Assert
        var act = () => _handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*hết hạn*");
    }

    [Fact]
    public async Task Handle_ShouldReturnNewTokens_WhenTokenIsValid()
    {
        // Arrange
        var user = new User("test", "test@test.com", "hash", "Client");
        user.UpdateRefreshToken("valid-rt", DateTime.UtcNow.AddDays(1));

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });
        _tokenServiceMock.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("new-at");
        _tokenServiceMock.Setup(x => x.GenerateRefreshToken()).Returns("new-rt");

        var command = new RefreshTokenCommand("fake-at", "valid-rt");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.token.Should().Be("new-at");
        result.refreshToken.Should().Be("new-rt");
        user.RefreshToken.Should().Be("new-rt");
        _dbContextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenUserIsBlacklisted()
    {
        // Arrange
        var user = new User("test", "test@test.com", "hash", "Client");
        user.UpdateRefreshToken("valid-rt", DateTime.UtcNow.AddDays(1));
        user.Blacklist("Reason");

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new RefreshTokenCommand("fake-at", "valid-rt");

        // Act & Assert
        var act = () => _handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("*khóa*");
    }
}
