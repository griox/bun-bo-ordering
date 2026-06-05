using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BunBo.SharedKernel.Messaging;
using FluentAssertions;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;
using PromotionService.Infrastructure.Data;
using PromotionService.Infrastructure.Messaging.Consumers;
using Xunit;

namespace PromotionService.UnitTests.Messaging;

public class OrderStatusUpdatedConsumerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly Mock<ILogger<OrderStatusUpdatedEventConsumer>> _loggerMock;
    private readonly OrderStatusUpdatedEventConsumer _consumer;

    public OrderStatusUpdatedConsumerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();

        _loggerMock = new Mock<ILogger<OrderStatusUpdatedEventConsumer>>();
        _consumer = new OrderStatusUpdatedEventConsumer(_context, _loggerMock.Object);
    }

    [Fact]
    public async Task Consume_ShouldAwardPoints_WhenStatusChangesToPaid()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var totalAmount = 150000m; // Should earn 15 points
        
        var @event = new OrderStatusUpdatedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            NewStatus = "Paid",
            TotalAmount = totalAmount,
            UpdatedAt = DateTime.UtcNow
        };

        var consumeContextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        consumeContextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(consumeContextMock.Object);

        // Assert
        var loyaltyPoint = await _context.LoyaltyPoints.SingleOrDefaultAsync(lp => lp.UserId == customerId);
        loyaltyPoint.Should().NotBeNull();
        loyaltyPoint.TotalPoints.Should().Be(15);

        var transaction = await _context.PointTransactions.SingleOrDefaultAsync(t => t.OrderId == orderId);
        transaction.Should().NotBeNull();
        transaction.UserId.Should().Be(customerId);
        transaction.Points.Should().Be(15);
        transaction.Type.Should().Be(TransactionType.Earn);
    }

    [Fact]
    public async Task Consume_ShouldNotAwardPoints_WhenNewStatusIsNotPaid()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        
        var @event = new OrderStatusUpdatedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            NewStatus = "Processing",
            TotalAmount = 150000m
        };

        var consumeContextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        consumeContextMock.Setup(x => x.Message).Returns(@event);

        // Act
        await _consumer.Consume(consumeContextMock.Object);

        // Assert
        var loyaltyPoint = await _context.LoyaltyPoints.SingleOrDefaultAsync(lp => lp.UserId == customerId);
        loyaltyPoint.Should().BeNull();

        var transaction = await _context.PointTransactions.SingleOrDefaultAsync(t => t.OrderId == orderId);
        transaction.Should().BeNull();
    }

    [Fact]
    public async Task Consume_ShouldNotAwardPoints_WhenTransactionAlreadyProcessed()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        
        var @event = new OrderStatusUpdatedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            NewStatus = "Paid",
            TotalAmount = 150000m
        };

        var consumeContextMock = new Mock<ConsumeContext<OrderStatusUpdatedEvent>>();
        consumeContextMock.Setup(x => x.Message).Returns(@event);

        // Pre-populate database with an existing earn transaction
        var existingTransaction = new PointTransaction(customerId, 15, TransactionType.Earn, orderId, "Test");
        var existingLoyalty = new LoyaltyPoint(customerId);
        existingLoyalty.AddPoints(15);

        _context.PointTransactions.Add(existingTransaction);
        _context.LoyaltyPoints.Add(existingLoyalty);
        await _context.SaveChangesAsync();

        // Act
        await _consumer.Consume(consumeContextMock.Object);

        // Assert
        var loyaltyPoint = await _context.LoyaltyPoints.SingleAsync(lp => lp.UserId == customerId);
        loyaltyPoint.TotalPoints.Should().Be(15); // Remains 15

        var transactionCount = await _context.PointTransactions.CountAsync(t => t.OrderId == orderId);
        transactionCount.Should().Be(1);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
