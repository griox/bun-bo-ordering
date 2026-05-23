using CatalogService.Application.Foods.Queries;
using CatalogService.Application.Interfaces;
using CatalogService.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Moq;
using Moq.EntityFrameworkCore;
using Xunit;
using System.Text.Json;
using System.Text;

namespace CatalogService.UnitTests.Application;

public class GetFoodsQueryHandlerTests
{
    private readonly Mock<IAppDbContext> _contextMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<IDistributedCache> _cacheMock;
    private readonly GetFoodsQueryHandler _handler;

    public GetFoodsQueryHandlerTests()
    {
        _contextMock = new Mock<IAppDbContext>();
        _configurationMock = new Mock<IConfiguration>();
        _cacheMock = new Mock<IDistributedCache>();

        _configurationMock.Setup(c => c["S3Settings:PublicUrl"]).Returns("http://localhost:9000");

        _handler = new GetFoodsQueryHandler(_contextMock.Object, _configurationMock.Object, _cacheMock.Object);
    }

    [Fact]
    public async Task Handle_CacheHit_ShouldReturnCachedData()
    {
        // Arrange
        var cachedData = new PagedResult<FoodDto>(new List<FoodDto>(), 0, 0, 50);
        var cachedJson = JsonSerializer.Serialize(cachedData);
        var cachedBytes = Encoding.UTF8.GetBytes(cachedJson);

        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedBytes);

        var query = new GetFoodsQuery(0, 50);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.TotalCount.Should().Be(0);
        _contextMock.Verify(x => x.Foods, Times.Never);
    }

    [Fact]
    public async Task Handle_CacheMiss_ShouldFetchFromDbAndCache()
    {
        // Arrange
        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[])null!);

        var category = new Category("Noodle");
        SetId(category, 1);

        var food1 = new Food("Bun Bo Hue", "Special", null, 50000, 1);
        SetId(food1, Guid.NewGuid());
        SetProperty(food1, "Category", category);

        var food2 = new Food("Pho Bo", "Noodle", null, 40000, 1);
        SetId(food2, Guid.NewGuid());
        SetProperty(food2, "Category", category);

        var foods = new List<Food> { food1, food2 };
        _contextMock.Setup(x => x.Foods).ReturnsDbSet(foods);

        var query = new GetFoodsQuery(0, 50);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);

        // Verify that it cached the result
        _cacheMock.Verify(x => x.SetAsync(
            It.Is<string>(k => k == "foods_skip_0_take_50"),
            It.IsAny<byte[]>(),
            It.IsAny<DistributedCacheEntryOptions>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithMinioImage_ShouldReplacePublicUrl()
    {
        // Arrange
        _cacheMock.Setup(x => x.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((byte[])null!);

        var food1 = new Food("Bun Bo Hue", "Special", "http://minio:9000/bucket/test.jpg", 50000, 1);
        SetId(food1, Guid.NewGuid());

        _contextMock.Setup(x => x.Foods).ReturnsDbSet(new List<Food> { food1 });

        var query = new GetFoodsQuery(0, 50);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Items.First().ImageUrl.Should().Be("http://localhost:9000/bucket/test.jpg");
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
