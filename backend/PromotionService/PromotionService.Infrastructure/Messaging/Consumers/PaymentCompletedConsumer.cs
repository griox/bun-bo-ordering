using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;
using PromotionService.Domain.Enums;

namespace PromotionService.Infrastructure.Messaging.Consumers;

public class PaymentCompletedConsumer : IConsumer<PaymentCompletedEvent>
{
    private readonly IAppDbContext _context;
    private readonly ILogger<PaymentCompletedConsumer> _logger;

    public PaymentCompletedConsumer(IAppDbContext context, ILogger<PaymentCompletedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedEvent> context)
    {
        var @event = context.Message;

        if (!@event.IsSuccess || !@event.CustomerId.HasValue)
        {
            _logger.LogWarning("Payment failed or CustomerId is missing for Order {OrderId}", @event.OrderId);
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
            int pointsToEarn = (int)(@event.Amount / 10000);
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

            // Voucher usage consumption
            if (!string.IsNullOrEmpty(@event.VoucherCode))
            {
                _logger.LogInformation("Processing voucher usage for Code {VoucherCode} for Order {OrderId}", 
                    @event.VoucherCode, @event.OrderId);
                
                // Lock voucher for update to prevent race conditions in IncrementUsage
                var voucher = await _context.Vouchers
                    .FromSqlRaw("SELECT * FROM \"Vouchers\" WHERE \"Code\" = {0} FOR UPDATE", @event.VoucherCode)
                    .SingleOrDefaultAsync();

                if (voucher != null)
                {
                    voucher.IncrementUsage();
                    _logger.LogInformation("Incremented usage for Voucher {VoucherCode}", @event.VoucherCode);
                    
                    // Record user voucher mapping if customer is logged in
                    var userVoucher = new UserVoucher(userId, voucher.Id, @event.OrderId);
                    _context.UserVouchers.Add(userVoucher);
                }
                else
                {
                    _logger.LogWarning("Voucher {VoucherCode} not found in database.", @event.VoucherCode);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            _logger.LogInformation("Successfully awarded points and processed voucher for User {UserId} (Order {OrderId})", 
                userId, @event.OrderId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error processing PaymentCompletedEvent for Order {OrderId}", @event.OrderId);
            throw; // Re-throw for MassTransit retry
        }
    }
}
