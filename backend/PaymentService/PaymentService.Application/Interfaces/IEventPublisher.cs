using System;
using System.Threading;
using System.Threading.Tasks;

namespace PaymentService.Application.Interfaces;

public interface IEventPublisher
{
    Task PublishPaymentCompletedEventAsync(Guid orderId, bool isSuccess, decimal amount, Guid? customerId, string? voucherCode, Guid? tableSessionId = null, string? tableNumber = null, string? note = null, string? transactionId = null, CancellationToken cancellationToken = default);
}
