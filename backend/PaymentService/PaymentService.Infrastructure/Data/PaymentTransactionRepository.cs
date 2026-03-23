using Microsoft.EntityFrameworkCore;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PaymentService.Infrastructure.Data;

public class PaymentTransactionRepository : IPaymentTransactionRepository
{
    private readonly PaymentDbContext _context;

    public PaymentTransactionRepository(PaymentDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default)
    {
        await _context.PaymentTransactions.AddAsync(transaction, cancellationToken);
    }

    public async Task<PaymentTransaction?> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .FirstOrDefaultAsync(t => t.OrderId == orderId, cancellationToken);
    }

    public async Task<PaymentTransaction?> GetByTransactionIdAsync(string transactionId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .FirstOrDefaultAsync(t => t.TransactionId == transactionId, cancellationToken);
    }

    public Task UpdateAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default)
    {
        _context.PaymentTransactions.Update(transaction);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
