using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PaymentService.Application.Interfaces;

namespace PaymentService.Application.Commands;

public class ProcessPaymentWebhookCommandHandler : IRequestHandler<ProcessPaymentWebhookCommand, bool>
{
    private readonly IPaymentTransactionRepository _repository;
    private readonly ISignatureValidator _signatureValidator;
    private readonly IEventPublisher _eventPublisher;

    public ProcessPaymentWebhookCommandHandler(
        IPaymentTransactionRepository repository,
        ISignatureValidator signatureValidator,
        IEventPublisher eventPublisher)
    {
        _repository = repository;
        _signatureValidator = signatureValidator;
        _eventPublisher = eventPublisher;
    }

    public async Task<bool> Handle(ProcessPaymentWebhookCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify signature
        var payload = $"{request.OrderId}|{request.Amount}|{request.ProviderTransactionId}|{request.Status}"; // Simplified for test
        if (!_signatureValidator.IsValid(payload, request.Signature))
        {
            return false;
        }

        // 2. Get transaction
        var transaction = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (transaction == null)
        {
            return false;
        }

        // 3. Update status
        if (request.Status.Equals("Success", StringComparison.OrdinalIgnoreCase))
        {
            transaction.MarkAsSuccess(request.ProviderTransactionId, request.Signature);
        }
        else
        {
            transaction.MarkAsFailed();
        }

        await _repository.SaveChangesAsync(cancellationToken);

        // 4. Publish Event
        var isSuccess = transaction.Status == Domain.Enums.PaymentStatus.Success;
        await _eventPublisher.PublishPaymentCompletedEventAsync(
            transaction.OrderId, 
            isSuccess, 
            transaction.Amount, 
            transaction.CustomerId, 
            transaction.VoucherCode,
            cancellationToken);

        return true;
    }
}
