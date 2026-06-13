using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using OrderService.Application.TableSessions.Commands;
using OrderService.Domain.Entities;
using OrderService.Infrastructure.Data;
using BunBo.SharedKernel;
using Xunit;

namespace OrderService.UnitTests.Application;

public class OpenSessionCommandHandlerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly OpenSessionCommandHandler _handler;

    public OpenSessionCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        _handler = new OpenSessionCommandHandler(_context, _cache);
    }

    [Fact]
    public async Task Handle_WithNonExistentTable_ShouldThrowDomainException()
    {
        // Arrange
        var command = new OpenSessionCommand { TableId = Guid.NewGuid() };

        // Act
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DomainException>()
            .WithMessage("Bàn không tồn tại.");
    }

    [Fact]
    public async Task Handle_WithValidTable_ShouldCreateSessionAndCacheTable()
    {
        // Arrange
        var table = new RestaurantTable("T1", "Bàn số 1");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var command = new OpenSessionCommand { TableId = table.Id };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.SessionId.Should().NotBeEmpty();
        result.GroupCode.Should().HaveLength(4);
        
        // Verify session was written to DB
        var sessionInDb = await _context.TableSessions.FirstOrDefaultAsync(s => s.Id == result.SessionId);
        sessionInDb.Should().NotBeNull();
        sessionInDb!.TableId.Should().Be(table.Id);
        sessionInDb.GroupCode.Should().Be(result.GroupCode);

        // Verify table existence is cached
        var cacheKey = $"table_exists_{table.Id}";
        _cache.TryGetValue(cacheKey, out bool exists).Should().BeTrue();
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_SubsequentCalls_ShouldUseCacheAndBypassDatabase()
    {
        // Arrange
        var table = new RestaurantTable("T2", "Bàn số 2");
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();

        var command = new OpenSessionCommand { TableId = table.Id };

        // 1. First scan - should hit DB, validate table, and cache it.
        var firstResult = await _handler.Handle(command, CancellationToken.None);
        firstResult.Should().NotBeNull();

        // 2. Delete the session and table from the DB entirely!
        var sessionsToDelete = await _context.TableSessions.Where(s => s.TableId == table.Id).ToListAsync();
        _context.TableSessions.RemoveRange(sessionsToDelete);
        _context.RestaurantTables.Remove(table);
        await _context.SaveChangesAsync();

        // 3. Second scan - if it hits DB, it will throw DomainException because table is deleted.
        // But if it uses cache, it will bypass DB check and succeed.
        Func<Task> act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        
        var sessions = await _context.TableSessions.Where(s => s.TableId == table.Id).ToListAsync();
        sessions.Should().HaveCount(1); // Verify that a new session was successfully created!
    }

    public void Dispose()
    {
        _context.Dispose();
        _cache.Dispose();
    }
}
