using CartService.Infrastructure.Repositories;
using CartService.Domain.Entities;
using Moq;
using StackExchange.Redis;
using FluentAssertions;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace CartService.UnitTests.Infrastructure;

public class CartRepositoryTests
{
    private readonly Mock<IConnectionMultiplexer> _redisMock;
    private readonly Mock<IDatabase> _databaseMock;
    private readonly Mock<ILogger<CartRepository>> _loggerMock;
    private readonly CartRepository _repository;

    public CartRepositoryTests()
    {
        _redisMock = new Mock<IConnectionMultiplexer>();
        _databaseMock = new Mock<IDatabase>();
        _loggerMock = new Mock<ILogger<CartRepository>>();
        _redisMock.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>())).Returns(_databaseMock.Object);
        _repository = new CartRepository(_redisMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetCartAsync_ValidId_ShouldReturnCart()
    {
        // Arrange
        var cartOwnerId = "user123";
        var cart = new ShoppingCart(cartOwnerId);
        cart.Items.Add(new CartItem { FoodId = Guid.NewGuid(), FoodName = "Pho Bo", UnitPrice = 55000, Quantity = 1, Note = "" });
        
        var serializedCart = JsonSerializer.Serialize(cart);
        _databaseMock.Setup(x => x.StringGetAsync(It.Is<RedisKey>(k => k == $"cart:{cartOwnerId}"), It.IsAny<CommandFlags>()))
            .ReturnsAsync(serializedCart);

        // Act
        var result = await _repository.GetCartAsync(cartOwnerId);

        // Assert
        result.Should().NotBeNull();
        result!.CartOwnerId.Should().Be(cartOwnerId);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetCartAsync_EmptyId_ShouldReturnNull()
    {
        // Arrange
        _databaseMock.Setup(x => x.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        // Act
        var result = await _repository.GetCartAsync("nonexistent");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateCartAsync_ValidCart_ShouldReturnUpdatedCart()
    {
        // Arrange
        var cart = new ShoppingCart("user123");
        var serializedCart = JsonSerializer.Serialize(cart);
        
        _databaseMock.Setup(x => x.StringSetAsync(
            It.Is<RedisKey>(k => k == $"cart:{cart.CartOwnerId}"),
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<bool>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()))
            .ReturnsAsync(true);
            
        _databaseMock.Setup(x => x.StringGetAsync(It.IsAny<RedisKey>(), It.IsAny<CommandFlags>()))
            .ReturnsAsync(serializedCart);

        // Act
        var result = await _repository.UpdateCartAsync(cart);

        // Assert
        result.Should().NotBeNull();
        _databaseMock.Verify(x => x.StringSetAsync(
            $"cart:{cart.CartOwnerId}",
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task DeleteCartAsync_ValidId_ShouldReturnTrue()
    {
        // Arrange
        var cartOwnerId = "user123";
        _databaseMock.Setup(x => x.KeyDeleteAsync(It.Is<RedisKey>(k => k == $"cart:{cartOwnerId}"), It.IsAny<CommandFlags>()))
            .ReturnsAsync(true);

        // Act
        var result = await _repository.DeleteCartAsync(cartOwnerId);

        // Assert
        result.Should().BeTrue();
    }
}
