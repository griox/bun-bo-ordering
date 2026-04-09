using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Moq;
using Moq.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace IdentityService.UnitTests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _tokenServiceMock = new Mock<ITokenService>();
        _handler = new LoginCommandHandler(_dbContextMock.Object, _tokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenUserIsBlacklisted()
    {
        // Arrange
        var username = "blacklistedUser";
        var password = "password123";
        var passwordHash = new PasswordHasher<User>().HashPassword(null!, password);
        var user = new User(username, "test@test.com", passwordHash, "Client");
        user.Blacklist("Spamming");

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new LoginCommand(username, password);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, CancellationToken.None));
        exception.Message.Should().Contain("Tài khoản của bạn đã bị khóa");
        exception.Message.Should().Contain("Spamming");
    }

    [Fact]
    public async Task Handle_ShouldReturnLoginResult_WhenUserIsNotBlacklisted()
    {
        // Arrange
        var username = "validUser";
        var password = "password123";
        var passwordHash = new PasswordHasher<User>().HashPassword(null!, password);
        var user = new User(username, "valid@test.com", passwordHash, "Client");

        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });
        _tokenServiceMock.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("fake-token");

        var command = new LoginCommand(username, password);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.token.Should().Be("fake-token");
        result.username.Should().Be(username);
    }
}
