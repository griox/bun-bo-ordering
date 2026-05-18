using BunBo.SharedKernel;
using IdentityService.Application.Auth.Commands;
using IdentityService.Application.Interfaces;
using IdentityService.Domain.Entities;
using Moq;
using Moq.EntityFrameworkCore;
using FluentAssertions;
using MassTransit;

namespace IdentityService.UnitTests.Auth;

public class GoogleLoginCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _dbContextMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IGoogleAuthService> _googleAuthServiceMock;
    private readonly Mock<IPublishEndpoint> _publishEndpointMock;
    private readonly GoogleLoginCommandHandler _handler;

    public GoogleLoginCommandHandlerTests()
    {
        _dbContextMock = new Mock<IAppDbContext>();
        _tokenServiceMock = new Mock<ITokenService>();
        _googleAuthServiceMock = new Mock<IGoogleAuthService>();
        _publishEndpointMock = new Mock<IPublishEndpoint>();
        
        _handler = new GoogleLoginCommandHandler(
            _dbContextMock.Object, 
            _tokenServiceMock.Object,
            _googleAuthServiceMock.Object,
            _publishEndpointMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldThrowDomainException_WhenUserIsBlacklisted()
    {
        // Arrange
        var accessToken = "valid-google-access-token";
        var googleId = "123456789";
        var email = "blocked@test.com";

        // Setup mock Google Auth service to return valid Google user info
        _googleAuthServiceMock
            .Setup(x => x.GetUserInfoAsync(accessToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GoogleUserInfo(googleId, email, "Test User"));

        // Create a user that is blacklisted
        var user = User.CreateGoogleUser(email, googleId);
        user.Blacklist("Tài khoản gian lận");

        // Mock DB Context to return this user
        _dbContextMock.Setup(x => x.Users).ReturnsDbSet(new List<User> { user });

        var command = new GoogleLoginCommand(accessToken);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<DomainException>(() => _handler.Handle(command, CancellationToken.None));
        
        exception.Message.Should().Contain("Tài khoản của bạn đã bị khóa");
        exception.Message.Should().Contain("Tài khoản gian lận");
    }
}
