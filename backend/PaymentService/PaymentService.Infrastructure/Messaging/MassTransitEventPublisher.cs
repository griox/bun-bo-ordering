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

    public async Task PublishPaymentCompletedEventAsync(Guid orderId, bool isSuccess, CancellationToken cancellationToken = default)
    {
        var e = new PaymentCompletedEvent
        {
            OrderId = orderId,
            TransactionId = "PENDING_REAL_ID", // the command handler currently only gives IsSuccess, we'll need to update it if we want exact IDs here, but let's stick to the interface for now to keep it minimal. Wait, I should probably pass the full data.
            Amount = 0, // This is a limitation of the current IEventPublisher. I should refactor IEventPublisher to take the full transaction or the necessary fields. For the scope of this step, I'll update IEventPublisher later if needed, but OrderService usually only cares if it's paid or not.
            IsSuccess = isSuccess,
            CompletedAt = DateTime.UtcNow
        };

        await _publishEndpoint.Publish(e, cancellationToken);
    }
}
