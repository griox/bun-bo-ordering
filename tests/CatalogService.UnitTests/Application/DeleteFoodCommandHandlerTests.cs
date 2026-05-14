using CatalogService.Application.Foods.Commands;
using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using FluentAssertions;
using Moq;
using Moq.EntityFrameworkCore;
using Xunit;

namespace CatalogService.UnitTests.Application;

public class DeleteFoodCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IFileStorageService> _storageServiceMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly DeleteFoodCommandHandler _handler;

    public DeleteFoodCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _storageServiceMock = new Mock<IFileStorageService>();
        _cacheServiceMock = new Mock<ICacheService>();
        _handler = new DeleteFoodCommandHandler(_contextMock.Object, _storageServiceMock.Object, _cacheServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequestWithImage_ShouldDeleteImageAndRemoveFood()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var imageUrl = "http://s3.com/food.jpg";
        var food = new Food("Name", null, imageUrl, 50000, 1);
        SetId(food, foodId);

        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { food });

        var command = new DeleteFoodCommand(foodId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        _storageServiceMock.Verify(x => x.DeleteFileAsync(imageUrl), Times.Once);
        _contextMock.Verify(x => x.Foods.Remove(It.Is<Food>(f => f.Id == foodId)), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_FoodNotFound_ShouldReturnFalse()
    {
        // Arrange
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food>());

        var command = new DeleteFoodCommand(Guid.NewGuid());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
