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
            // 1. Đọc ở ngoài Transaction
            var exists = await _context.UserVouchers.AsNoTracking()
                .AnyAsync(uv => uv.OrderId == @event.OrderId);

            if (exists)
            {
                _logger.LogInformation("Voucher for Order {OrderId} already processed.", @event.OrderId);
                return;
            }

            _logger.LogInformation("Processing voucher usage for Code {VoucherCode} for Order {OrderId}", 
                @event.VoucherCode, @event.OrderId);
            
            var upperVoucherCode = @event.VoucherCode.ToUpperInvariant();
            
            var voucherId = await _context.Vouchers.AsNoTracking()
                .Where(v => v.Code == upperVoucherCode)
                .Select(v => v.Id)
                .SingleOrDefaultAsync();

            if (voucherId == Guid.Empty)
            {
                _logger.LogWarning("Voucher {VoucherCode} not found in database.", @event.VoucherCode);
                return;
            }

            // 2. Mở Transaction để ghi dữ liệu
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var rowsAffected = await _context.Vouchers
                    .Where(v => v.Id == voucherId && v.UsageCount < v.TotalUsageLimit)
                    .ExecuteUpdateAsync(s => s.SetProperty(v => v.UsageCount, v => v.UsageCount + 1));

                if (rowsAffected > 0)
                {
                    _logger.LogInformation("Incremented usage for Voucher {VoucherCode}", @event.VoucherCode);

                    if (@event.CustomerId.HasValue)
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

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    
                    _logger.LogInformation("Successfully processed voucher usage for Order {OrderId}", @event.OrderId);
                }
                else
                {
                    await transaction.RollbackAsync();
                    _logger.LogWarning("Voucher {VoucherCode} already reached max usage or concurrency conflict.", @event.VoucherCode);
                }
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
