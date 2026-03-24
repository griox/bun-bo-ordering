using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;

namespace PaymentService.Application.Commands;

public class CreatePaymentCommandHandler : IRequestHandler<CreatePaymentCommand, string>
{
    private readonly IPaymentTransactionRepository _repository;

    public CreatePaymentCommandHandler(IPaymentTransactionRepository repository)
    {
        _repository = repository;
    }

    public async Task<string> Handle(CreatePaymentCommand request, CancellationToken cancellationToken)
    {
        // Check if there's already a pending transaction for this order
        var existing = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (existing == null)
        {
            var tx = new PaymentTransaction(request.OrderId, request.Amount, request.Provider);
            await _repository.AddAsync(tx, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        // We aren't generating a sePay generic link in the BE anymore because React creates the VietQR locally.
        // We will just return the Provider to satisfy the flow.
        return request.Provider;
    }
}
