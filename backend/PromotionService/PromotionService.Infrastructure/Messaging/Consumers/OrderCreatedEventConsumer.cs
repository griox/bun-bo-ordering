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
                
                // Lock voucher for update to prevent race conditions in IncrementUsage
                var voucher = await _context.Vouchers
                    .FromSqlRaw("SELECT * FROM \"Vouchers\" WHERE \"Code\" = {0} FOR UPDATE", @event.VoucherCode)
                    .SingleOrDefaultAsync();

                if (voucher != null)
                {
                    voucher.IncrementUsage();
                    _logger.LogInformation("Incremented usage for Voucher {VoucherCode}", @event.VoucherCode);
                    
                    // Record user voucher mapping if customer is logged in
                    if (@event.CustomerId.HasValue)
                    {
                        var userId = @event.CustomerId.Value;
                        var existingUserVoucher = await _context.UserVouchers
                            .SingleOrDefaultAsync(uv => uv.UserId == userId && uv.VoucherId == voucher.Id);
                        
                        if (existingUserVoucher != null)
                        {
                            if (!existingUserVoucher.IsUsed)
                            {
                                existingUserVoucher.Use(@event.OrderId);
                            }
                        }
                        else
                        {
                            var userVoucher = new UserVoucher(userId, voucher.Id, @event.OrderId);
                            _context.UserVouchers.Add(userVoucher);
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Voucher {VoucherCode} not found in database.", @event.VoucherCode);
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
