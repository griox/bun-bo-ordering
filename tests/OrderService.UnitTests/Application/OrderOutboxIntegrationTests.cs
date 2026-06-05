using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using OrderService.Application.Dtos;
using OrderService.Application.Interfaces;
using OrderService.Application.Orders.Commands;
using OrderService.Domain.Entities;
using OrderService.Domain.Enums;
using OrderService.Infrastructure.Data;
using Xunit;

namespace OrderService.UnitTests.Application;

public class OrderOutboxIntegrationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly ServiceProvider _serviceProvider;
    private readonly Mock<ICartDataClient> _cartDataClientMock;
    private readonly Mock<ILogger<CreateOrderCommandHandler>> _loggerMock;

    public OrderOutboxIntegrationTests()
    {
        // 1. Create a SQLite in-memory connection and open it to keep the database alive
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var services = new ServiceCollection();

        // 2. Add DbContext using SQLite
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlite(_connection);
        });
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        // 3. Add MassTransit with EF Outbox
        services.AddMassTransit(x =>
        {
            x.AddEntityFrameworkOutbox<AppDbContext>(o =>
            {
                o.UseSqlite();
                o.UseBusOutbox();
            });

            x.UsingInMemory((context, cfg) =>
            {
                cfg.ConfigureEndpoints(context);
            });
        });

        // 4. Mocks
        _cartDataClientMock = new Mock<ICartDataClient>();
        services.AddSingleton(_cartDataClientMock.Object);

        _loggerMock = new Mock<ILogger<CreateOrderCommandHandler>>();
        services.AddSingleton(_loggerMock.Object);

        // 5. Add Handlers
        services.AddScoped<CreateOrderCommandHandler>();
        services.AddScoped<UpdateOrderStatusCommandHandler>();

        _serviceProvider = services.BuildServiceProvider();

        // 6. Ensure schema is created (including Outbox tables)
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task CreateOrder_ShouldSaveOutboxMessageToDatabase()
    {
        // Arrange
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var handler = scope.ServiceProvider.GetRequiredService<CreateOrderCommandHandler>();

        // Set up test data
        var table = new RestaurantTable("T1", "Table 1");
        context.RestaurantTables.Add(table);
        await context.SaveChangesAsync();

        var sessionId = Guid.NewGuid();
        var session = new TableSession(table.Id, "1234");
        SetId(session, sessionId);
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var cart = new CartDto
        {
            CartOwnerId = sessionId.ToString(),
            Items = new List<CartItemDto>
            {
                new CartItemDto { FoodId = Guid.NewGuid(), FoodName = "Bun Bo Hue", Quantity = 2, UnitPrice = 50000 }
            }
        };
        _cartDataClientMock.Setup(x => x.GetCartAsync(sessionId.ToString())).ReturnsAsync(cart);

        var command = new CreateOrderCommand(sessionId, null, "No spicy", "Cash");

        // Act
        var orderId = await handler.Handle(command, CancellationToken.None);

        // Assert
        orderId.Should().NotBeEmpty();

        // Verify order is saved
        var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        order.Should().NotBeNull();

        // Verify OutboxMessage table has the published event!
        var outboxMessages = await context.Set<MassTransit.EntityFrameworkCoreIntegration.OutboxMessage>().ToListAsync();
        outboxMessages.Should().ContainSingle();
        outboxMessages[0].MessageType.Should().Contain(nameof(OrderCreatedEvent));
    }

    [Fact]
    public async Task UpdateOrderStatus_ShouldSaveOutboxMessageToDatabase()
    {
        // Arrange
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var handler = scope.ServiceProvider.GetRequiredService<UpdateOrderStatusCommandHandler>();

        // Set up test data (need real table and session due to foreign key constraints in SQLite)
        var table = new RestaurantTable("T1", "Table 1");
        context.RestaurantTables.Add(table);
        await context.SaveChangesAsync();

        var sessionId = Guid.NewGuid();
        var session = new TableSession(table.Id, "1234");
        SetId(session, sessionId);
        context.TableSessions.Add(session);
        await context.SaveChangesAsync();

        var orderId = Guid.NewGuid();
        var order = new Order(sessionId, null, null, "Cash");
        SetId(order, orderId);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var command = new UpdateOrderStatusCommand(orderId, OrderStatus.Paid);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();

        // Verify OutboxMessage table has the published event!
        var outboxMessages = await context.Set<MassTransit.EntityFrameworkCoreIntegration.OutboxMessage>().ToListAsync();
        outboxMessages.Should().ContainSingle();
        outboxMessages[0].MessageType.Should().Contain(nameof(OrderStatusUpdatedEvent));
    }

    private void SetId<TId>(object entity, TId id)
    {
        var property = entity.GetType().GetProperty("Id");
        property?.SetValue(entity, id);
    }

    public void Dispose()
    {
        _serviceProvider.Dispose();
        _connection.Dispose();
    }
}
