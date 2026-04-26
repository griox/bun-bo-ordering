using System;
using System.Threading;
using System.Threading.Tasks;

namespace PaymentService.Application.Interfaces;

public interface IEventPublisher
{
    Task PublishPaymentCompletedEventAsync(Guid orderId, bool isSuccess, decimal amount, Guid? customerId, string? voucherCode, CancellationToken cancellationToken = default);
}
