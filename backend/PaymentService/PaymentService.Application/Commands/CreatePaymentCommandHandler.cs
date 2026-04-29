using System.Threading;
using System.Threading.Tasks;
using MediatR;
using PaymentService.Application.Interfaces;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Enums;

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
        // Idempotency: check for existing transaction record
        var existing = await _repository.GetByOrderIdAsync(request.OrderId, cancellationToken);
        if (existing != null)
        {
            // If already successfully paid, block re-payment to prevent double-charging
            if (existing.Status == PaymentStatus.Success)
            {
                return new SePayCheckoutResponse
                {
                    Success = false,
                    Message = "Đơn hàng này đã được thanh toán thành công trước đó."
                };
            }

            // If pending, fall through and re-generate the checkout URL (e.g., user refreshed the page)
        }
        else
        {
            // Create a new pending transaction record
            var tx = new PaymentTransaction(request.OrderId, request.Amount, request.Provider, request.CustomerId, null, request.VoucherCode, request.TableSessionId, request.TableNumber, request.Note);
            await _repository.AddAsync(tx, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
        }

        // Call SePay to generate checkout and QR endpoints
        // MUST INCLUDE "SEVQR" PREFIX so SePay recognizes it as a system transaction and triggers the webhook
        var description = $"SEVQR {request.OrderId}";
        var response = await _sePayService.CreateCheckoutUrlAsync(request.OrderId, request.Amount, description, cancellationToken);

        return response;
    }
}
