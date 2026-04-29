using CatalogService.Application.Foods.Commands;
using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using BunBo.SharedKernel;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using Moq.EntityFrameworkCore;
using Xunit;

namespace CatalogService.UnitTests.Application;

public class UpdateFoodCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IFileStorageService> _storageServiceMock;
    private readonly UpdateFoodCommandHandler _handler;

    public UpdateFoodCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _storageServiceMock = new Mock<IFileStorageService>();
        _handler = new UpdateFoodCommandHandler(_contextMock.Object, _storageServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldUpdateFoodAndReturnTrue()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        var food = new Food("Original Name", "Desc", null, 50000, categoryId);
        SetId(food, foodId);

        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { food });

        var command = new UpdateFoodCommand(foodId, "Updated Name", "New Desc", 60000, categoryId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        food.Name.Should().Be("Updated Name");
        food.Price.Should().Be(60000);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_FoodNotFound_ShouldReturnFalse()
    {
        // Arrange
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food>());

        var command = new UpdateFoodCommand(Guid.NewGuid(), "Name", null, 50000, categoryId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeFalse();
    }

    // --- TDD: Missing Features (RED Phase) ---

    [Fact]
    public async Task Handle_DuplicateFoodName_ShouldThrowException()
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        var existingFood = new Food("Original Name", null, null, 50000, categoryId);
        SetId(existingFood, foodId);

        var anotherFood = new Food("Duplicate Name", null, null, 50000, categoryId);
        SetId(anotherFood, Guid.NewGuid());

        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { existingFood, anotherFood });

        var command = new UpdateFoodCommand(foodId, "Duplicate Name", null, 60000, categoryId, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Food with this name already exists in this category");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task Handle_InvalidPrice_ShouldThrowException(decimal invalidPrice)
    {
        // Arrange
        var foodId = Guid.NewGuid();
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        var food = new Food("Name", null, null, 50000, categoryId);
        SetId(food, foodId);

        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { food });

        var command = new UpdateFoodCommand(foodId, "Name", null, invalidPrice, categoryId, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Price must be greater than zero");
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }
}
