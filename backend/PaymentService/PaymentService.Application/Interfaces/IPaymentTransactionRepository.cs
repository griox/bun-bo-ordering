using System;
using System.Threading;
using System.Threading.Tasks;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.Interfaces;

public interface IPaymentTransactionRepository
{
    Task<PaymentTransaction?> GetByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<PaymentTransaction?> GetByTransactionIdAsync(string transactionId, CancellationToken cancellationToken = default);
    Task AddAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default);
    Task UpdateAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
