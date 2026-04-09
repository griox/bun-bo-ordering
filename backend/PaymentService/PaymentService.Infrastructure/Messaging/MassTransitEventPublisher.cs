using System;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using BunBo.SharedKernel.Messaging;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Messaging;

public class MassTransitEventPublisher : IEventPublisher
{
    private readonly IPublishEndpoint _publishEndpoint;

    public MassTransitEventPublisher(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task PublishPaymentCompletedEventAsync(Guid orderId, bool isSuccess, decimal amount, Guid? customerId, CancellationToken cancellationToken = default)
    {
        var e = new PaymentCompletedEvent
        {
            OrderId = orderId,
            CustomerId = customerId,
            TransactionId = "PENDING_REAL_ID",
            Amount = amount,
            IsSuccess = isSuccess,
            CompletedAt = DateTime.UtcNow
        };

        await _publishEndpoint.Publish(e, cancellationToken);
    }
}
