using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.Commands;

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, SePayCheckoutResponse?>
{
    private readonly IPaymentTransactionRepository _repository;
    private readonly ISePayService _sePayService;

    public CreatePaymentCommandHandler(IPaymentTransactionRepository repository, ISePayService sePayService)
    {
        _repository = repository;
        _sePayService = sePayService;
    }

    public async Task<SePayCheckoutResponse?> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        // Check if there's already a pending transaction for this order
        var existing = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (existing == null)
        {
            var tx = new PaymentTransaction(request.OrderId, request.Amount, request.Provider, request.CustomerId, null, request.VoucherCode);
            await _repository.AddAsync(tx, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        // Call SePay to generate checkout and QR endpoints
        // Use full OrderId GUID to ensure webhook regex can match it
        // MUST INCLUDE "SEVQR" PREFIX so SePay recognizes it as a system transaction and triggers the webhook
        var description = $"SEVQR {request.OrderId}";
        var response = await _sePayService.CreateCheckoutUrlAsync(request.OrderId, request.Amount, description, cancellationToken);

        return response;
    }
}
