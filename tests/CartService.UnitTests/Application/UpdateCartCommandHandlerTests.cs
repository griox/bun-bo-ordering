using CartService.Application.Cart.Commands;
using CartService.Application.Interfaces;
using CartService.Domain.Entities;
using BunBo.SharedKernel;
using FluentAssertions;
using Moq;
using Xunit;

namespace CartService.UnitTests.Application;

public class UpdateCartCommandHandlerTests
{
    private readonly Mock<ICartRepository> _repositoryMock;
    private readonly Mock<ISyncCatalogClient> _catalogClientMock;
    private readonly UpdateCartCommandHandler _handler;

    public UpdateCartCommandHandlerTests()
    {
        _repositoryMock = new Mock<ICartRepository>();
        _catalogClientMock = new Mock<ISyncCatalogClient>();
        _handler = new UpdateCartCommandHandler(_repositoryMock.Object, _catalogClientMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCartWithItems_ShouldSyncPriceAndSave()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var cart = new ShoppingCart("user123");
        cart.Items.Add(new CartItem { FoodId = foodId, FoodName = "Old Name", UnitPrice = 10000, Quantity = 1 });

        var catalogInfo = new Dictionary<Guid, FoodItemInfo>
        {
            { foodId, new FoodItemInfo(55000, true, "Bun Bo Hue") }
        };

        _catalogClientMock.Setup(x => x.GetFoodPricesManyAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(catalogInfo);
        
        _repositoryMock.Setup(x => x.UpdateCartAsync(It.IsAny<ShoppingCart>()))
            .ReturnsAsync((ShoppingCart c) => c);

        var command = new UpdateCartCommand(cart);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items[0].UnitPrice.Should().Be(55000);
        result.Items[0].FoodName.Should().Be("Bun Bo Hue");
        _repositoryMock.Verify(x => x.UpdateCartAsync(cart), Times.Once);
    }

    [Fact]
    public async Task Handle_FoodNotFoundInCatalog_ShouldThrowDomainException()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var cart = new ShoppingCart("user123");
        cart.Items.Add(new CartItem { FoodId = foodId, Quantity = 1 });

        _catalogClientMock.Setup(x => x.GetFoodPricesManyAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(new Dictionary<Guid, FoodItemInfo>()); // Empty response

        var command = new UpdateCartCommand(cart);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage($"Food item {foodId} not found in catalog.");
    }

    [Fact]
    public async Task Handle_FoodNotAvailable_ShouldThrowDomainException()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var cart = new ShoppingCart("user123");
        cart.Items.Add(new CartItem { FoodId = foodId, Quantity = 1 });

        var catalogInfo = new Dictionary<Guid, FoodItemInfo>
        {
            { foodId, new FoodItemInfo(55000, false, "Bun Bo Hue") } // Not available
        };

        _catalogClientMock.Setup(x => x.GetFoodPricesManyAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(catalogInfo);

        var command = new UpdateCartCommand(cart);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Món \"Bun Bo Hue\" hiện không còn phục vụ.");
    }

    [Fact]
    public async Task Handle_EmptyCart_ShouldSkipCatalogSync()
    {
        // Arrange
        var cart = new ShoppingCart("user123");
        var command = new UpdateCartCommand(cart);

        _repositoryMock.Setup(x => x.UpdateCartAsync(It.IsAny<ShoppingCart>()))
            .ReturnsAsync((ShoppingCart c) => c);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _catalogClientMock.Verify(x => x.GetFoodPricesManyAsync(It.IsAny<IEnumerable<Guid>>()), Times.Never);
        _repositoryMock.Verify(x => x.UpdateCartAsync(cart), Times.Once);
    }
}
