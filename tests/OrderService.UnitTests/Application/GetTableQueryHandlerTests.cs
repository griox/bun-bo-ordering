using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OrderService.Application.TableSessions.Queries;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class GetTableQueryHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly GetTableQueryHandler _handler;

    public GetTableQueryHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        _handler = new GetTableQueryHandler(_context, _cache);
    }

    [Fact]
    public async Task Handle_WithValidTable_ShouldReturnTableAndCacheDetails()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Bàn số 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var query = new GetTableQuery { TableId = table.Id };

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(table.Id);
        result.TableCode.Should().Be(table.TableCode);
        result.Name.Should().Be(table.Name);

        // Verify table data is cached
        var cacheKey = $"table_data_{table.Id}";
        _cache.TryGetValue(cacheKey, out GetTableResponse? cachedData).Should().BeTrue();
        cachedData.Should().NotBeNull();
        cachedData!.Id.Should().Be(table.Id);
        cachedData.TableCode.Should().Be(table.TableCode);
        cachedData.Name.Should().Be(table.Name);
    }

    [Fact]
    public async Task Handle_SubsequentCalls_ShouldUseCacheAndBypassDatabase()
    {
        // Arrange
        var table = new RestaurantTable("T2", "Bàn số 2");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var query = new GetTableQuery { TableId = table.Id };

        // 1. First query - hits DB and caches it
        var firstResult = await _handler.Handle(query, CancellationToken.None);
        firstResult.Should().NotBeNull();

        // 2. Delete the table from DB
        _context.RestaurantTables.Remove(table);
        await _context.SaveChangesAsync();

        // 3. Second query - should succeed using cache
        var secondResult = await _handler.Handle(query, CancellationToken.None);

        // Assert
        secondResult.Should().NotBeNull();
        secondResult.Id.Should().Be(table.Id);
        secondResult.TableCode.Should().Be(table.TableCode);
        secondResult.Name.Should().Be(table.Name);
    }

    public void Dispose()
    {
        _context.Dispose();
        _cache.Dispose();
    }
}
