using CatalogService.Application.Foods.Queries;
using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Xunit;

namespace CatalogService.UnitTests.Application;

public class GetFoodsByCategoryQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IDistributedCache> _cacheMock;
    private readonly GetFoodsByCategoryQueryHandler _handler;

    public GetFoodsByCategoryQueryHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _configurationMock = new Mock<IConfiguration>();
        _cacheMock = new Mock<IDistributedCache>();

        _configurationMock.Setup(c => c["S3Settings:PublicUrl"]).Returns("http://localhost:9000");

        _handler = new GetFoodsByCategoryQueryHandler(_contextMock.Object, _configurationMock.Object, _cacheMock.Object);
    }

    [Fact]
    public async Task Handle_CacheHit_ShouldReturnCachedData()
    {
        // Arrange
        var cachedData = new List<FoodDto>
        {
            new FoodDto(Guid.NewGuid(), "Bun Bo", null, null, 50000, true, 1, "Noodle")
        };
        var cachedJson = JsonSerializer.Serialize(cachedData);
        var cachedBytes = Encoding.UTF8.GetBytes(cachedJson);

        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedBytes);

        var query = new GetFoodsByCategoryQuery(1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Name.Should().Be("Bun Bo");
        _contextMock.Verify(x => x.Foods, Times.Never);
    }

    [Fact]
    public async Task Handle_CacheMiss_ShouldFetchFromDbAndCache()
    {
        // Arrange
        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[])null!);

        var category1 = new Category("Noodle");
        SetId(category1, 1);
        var category2 = new Category("Drink");
        SetId(category2, 2);

        var food1 = new Food("Bun Bo Hue", "Special", null, 50000, 1);
        SetId(food1, Guid.NewGuid());
        SetProperty(food1, "Category", category1);

        var food2 = new Food("Pho Bo", "Noodle", null, 40000, 1);
        SetId(food2, Guid.NewGuid());
        SetProperty(food2, "Category", category1);

        var food3 = new Food("Coke", "Drink", null, 15000, 2);
        SetId(food3, Guid.NewGuid());
        SetProperty(food3, "Category", category2);

        var foods = new List<Food> { food1, food2, food3 };
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(foods);

        var query = new GetFoodsByCategoryQuery(1);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2); // Only category 1

        _cacheMock.Verify(x => x.SetAsync(
            It.Is<string>(k => k == "foods_category_1"),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_EmptyCategory_ShouldReturnEmptyList()
    {
        // Arrange
        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[])null!);

        var foods = new List<Food>();
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(foods);

        var query = new GetFoodsByCategoryQuery(99);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }

    private void SetProperty(object entity, string propertyName, object value)
    {
        var property = entity.GetType().GetProperty(propertyName);
        property?.SetValue(entity, value);
    }
}
