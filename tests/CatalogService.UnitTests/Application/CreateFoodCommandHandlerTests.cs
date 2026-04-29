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

public class CreateFoodCommandHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IFileStorageService> _storageServiceMock;
    private readonly CreateFoodCommandHandler _handler;

    public CreateFoodCommandHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _storageServiceMock = new Mock<IFileStorageService>();
        _handler = new CreateFoodCommandHandler(_contextMock.Object, _storageServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ShouldCreateFoodAndReturnId()
    {
        // Arrange
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);
        
        var categories = new List<Category> { category };
        _contextMock.Setup(x => x.Categories).ReturnsDbSet(categories);
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food>());

        var command = new CreateFoodCommand("Bun Bo Hue", "Special Noodle", 55000, categoryId, null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        _contextMock.Verify(x => x.Foods.Add(It.Is<Food>(f => f.Name == command.Name)), Times.Once);
        _contextMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_CategoryNotFound_ShouldThrowException()
    {
        // Arrange
        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category>());
        var command = new CreateFoodCommand("Bun Bo Hue", null, 55000, 99, null);

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>().WithMessage("Category not found");
    }

    // --- TDD: Missing Features (RED Phase) ---

    [Fact]
    public async Task Handle_DuplicateFoodName_ShouldThrowException()
    {
        // Arrange (RED: This will fail as current logic doesn't check for duplicates)
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        var existingFood = new Food("Bun Bo Hue", null, null, 50000, categoryId);
        
        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { existingFood });

        var command = new CreateFoodCommand("Bun Bo Hue", null, 60000, categoryId, null);

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
        // Arrange (RED: This will fail as current logic doesn't validate price)
        var categoryId = 1;
        var category = new Category("Noodle");
        SetId(category, categoryId);

        _contextMock.Setup(x => x.Categories).ReturnsDbSet(new List<Category> { category });
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food>());

        var command = new CreateFoodCommand("New Food", null, invalidPrice, categoryId, null);

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
