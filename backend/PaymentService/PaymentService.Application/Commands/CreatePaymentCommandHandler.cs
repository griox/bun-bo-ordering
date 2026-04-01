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
            var tx = new PaymentTransaction(request.OrderId, request.Amount, request.Provider);
            await _repository.AddAsync(tx, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        // Call SePay API to get checkout_url
        // Note: In a real app, description could be "Order #123"
        var description = $"ORDER {request.OrderId.ToString().Substring(0, 8).ToUpper()}";
        var response = await _sePayService.CreateCheckoutUrlAsync(request.OrderId, request.Amount, description, cancellationToken);

        return response;
    }
}
