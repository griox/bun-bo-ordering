using System.Threading.Tasks;

namespace PaymentService.Application.Interfaces;

public interface ISePayService
{
    Task<SePayCheckoutResponse?> CreateCheckoutUrlAsync(Guid orderId, decimal amount, string description, CancellationToken cancellationToken = default);
}

public class SePayCheckoutResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string CheckoutUrl { get; set; } = string.Empty;
    public string QrCode { get; set; } = string.Empty; // Base64 or URL
}
