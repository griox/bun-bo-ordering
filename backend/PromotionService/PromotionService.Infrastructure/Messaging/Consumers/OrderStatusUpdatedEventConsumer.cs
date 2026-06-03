using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;

namespace PromotionService.Infrastructure.Messaging.Consumers;

public class OrderStatusUpdatedEventConsumer : IConsumer<OrderStatusUpdatedEvent>
{
    private readonly IAppDbContext _context;
    private readonly ILogger<OrderStatusUpdatedEventConsumer> _logger;

    public OrderStatusUpdatedEventConsumer(IAppDbContext context, ILogger<OrderStatusUpdatedEventConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderStatusUpdatedEvent> context)
    {
        var @event = context.Message;

        // We only award points when the order status becomes Paid
        if (@event.NewStatus != "Paid" || !@event.CustomerId.HasValue)
        {
            return;
        }

        var userId = @event.CustomerId.Value;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Anti-cheat: Check if this transaction has already been processed (idempotency)
            var exists = await _context.PointTransactions
                .AnyAsync(t => t.OrderId == @event.OrderId && t.Type == TransactionType.Earn);
            
            if (exists)
            {
                _logger.LogInformation("Points for Order {OrderId} already awarded.", @event.OrderId);
                await transaction.RollbackAsync();
                return;
            }

            // Calculate Points: 1 point per 10,000 VND
            int pointsToEarn = (int)(@event.TotalAmount / 10000);
            if (pointsToEarn > 0)
            {
                _logger.LogInformation("Awarding {Points} points to User {UserId} for Order {OrderId}", 
                    pointsToEarn, userId, @event.OrderId);

                // Get or Create LoyaltyPoint record for user
                var loyaltyPoint = await _context.LoyaltyPoints
                    .SingleOrDefaultAsync(lp => lp.UserId == userId);

                if (loyaltyPoint == null)
                {
                    loyaltyPoint = new LoyaltyPoint(userId);
                    _context.LoyaltyPoints.Add(loyaltyPoint);
                }

                // Append to Ledger
                var pt = new PointTransaction(
                    userId,
                    pointsToEarn,
                    TransactionType.Earn,
                    @event.OrderId,
                    $"Tích điểm từ đơn hàng {@event.OrderId}"
                );

                loyaltyPoint.AddPoints(pointsToEarn);
                _context.PointTransactions.Add(pt);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            _logger.LogInformation("Successfully awarded points for User {UserId} (Order {OrderId})", 
                userId, @event.OrderId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error processing OrderStatusUpdatedEvent for Order {OrderId}", @event.OrderId);
            throw; // Re-throw for MassTransit retry
        }
    }
}
