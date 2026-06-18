using BunBo.SharedKernel.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using PromotionService.Application.Interfaces;
using PromotionService.Domain.Entities;

namespace PromotionService.Infrastructure.Messaging.Consumers;

public class OrderCreatedEventConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly IAppDbContext _context;
    private readonly ILogger<OrderCreatedEventConsumer> _logger;

    public OrderCreatedEventConsumer(IAppDbContext context, ILogger<OrderCreatedEventConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var @event = context.Message;

        if (string.IsNullOrEmpty(@event.VoucherCode))
        {
            return;
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Anti-cheat: Check if this voucher has already been processed for this order
                var exists = await _context.UserVouchers
                    .AnyAsync(uv => uv.OrderId == @event.OrderId);

                if (exists)
                {
                    _logger.LogInformation("Voucher for Order {OrderId} already processed.", @event.OrderId);
                    await transaction.RollbackAsync();
                    return;
                }

                _logger.LogInformation("Processing voucher usage for Code {VoucherCode} for Order {OrderId}", 
                    @event.VoucherCode, @event.OrderId);
                
                var upperVoucherCode = @event.VoucherCode.ToUpperInvariant();
                
                // Use Atomic Update to increment usage count without locking the row for the entire transaction
                var rowsAffected = await _context.Vouchers
                    .Where(v => v.Code == upperVoucherCode && v.UsageCount < v.TotalUsageLimit)
                    .ExecuteUpdateAsync(s => s.SetProperty(v => v.UsageCount, v => v.UsageCount + 1));

                if (rowsAffected > 0)
                {
                    _logger.LogInformation("Incremented usage for Voucher {VoucherCode}", @event.VoucherCode);
                    
                    // We need the voucher ID to create UserVoucher record
                    var voucherId = await _context.Vouchers
                        .Where(v => v.Code == upperVoucherCode)
                        .Select(v => v.Id)
                        .SingleOrDefaultAsync();

                    // Record user voucher mapping if customer is logged in
                    if (@event.CustomerId.HasValue && voucherId != Guid.Empty)
                    {
                        var userId = @event.CustomerId.Value;
                        var existingUserVoucher = await _context.UserVouchers
                            .SingleOrDefaultAsync(uv => uv.UserId == userId && uv.VoucherId == voucherId);
                        
                        if (existingUserVoucher != null)
                        {
                            if (!existingUserVoucher.IsUsed)
                            {
                                existingUserVoucher.Use(@event.OrderId);
                            }
                        }
                        else
                        {
                            var userVoucher = new UserVoucher(userId, voucherId, @event.OrderId);
                            _context.UserVouchers.Add(userVoucher);
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Voucher {VoucherCode} not found in database or already reached max usage.", @event.VoucherCode);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                _logger.LogInformation("Successfully processed voucher usage for Order {OrderId}", @event.OrderId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error processing OrderCreatedEvent for Order {OrderId}", @event.OrderId);
                throw; // Re-throw for MassTransit retry
            }
        });
    }
}
