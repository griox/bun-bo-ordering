using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PaymentService.Application.Interfaces;
using System;

namespace PaymentService.Application.Commands;

public class ProcessPaymentWebhookCommandHandler : IRequestHandler<ProcessPaymentWebhookCommand, bool>
{
    private readonly IPaymentTransactionRepository _repository;
    private readonly IEventPublisher _eventPublisher;

    public ProcessPaymentWebhookCommandHandler(
        IPaymentTransactionRepository repository,
        IEventPublisher eventPublisher)
    {
        _repository = repository;
        _eventPublisher = eventPublisher;
    }

    public async Task<bool> Handle(ProcessPaymentWebhookCommand request, CancellationToken cancellationToken)
    {
        // 1. Get transaction
        var transaction = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (transaction == null)
        {
            return false;
        }

        // 3. Idempotency check: skip if already in a terminal state (Success or Failed)
        // This prevents duplicate event publishing from webhook retries.
        if (transaction.Status == Domain.Enums.PaymentStatus.Success || transaction.Status == Domain.Enums.PaymentStatus.Failed)
        {
            // Already processed, return true to acknowledge to SePay so they stop retrying
            return true;
        }

        // 4. Update status
        if (request.Status.Equals("Success", StringComparison.OrdinalIgnoreCase))
        {
            transaction.MarkAsSuccess(request.ProviderTransactionId, request.Signature);
        }
        else
        {
            transaction.MarkAsFailed();
        }

        await _repository.SaveChangesAsync(cancellationToken);

        // 5. Publish Event (only fires once per order due to idempotency check above)
        var isSuccess = transaction.Status == Domain.Enums.PaymentStatus.Success;
        await _eventPublisher.PublishPaymentCompletedEventAsync(
            transaction.OrderId,
            isSuccess,
            transaction.Amount,
            transaction.CustomerId,
            transaction.VoucherCode,
            transaction.TableSessionId,
            transaction.TableNumber,
            transaction.Note,
            request.ProviderTransactionId,
            cancellationToken);

        return true;
    }
}
