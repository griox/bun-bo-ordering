using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Services;

public class SePayService : ISePayService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SePayService> _logger;

    public SePayService(HttpClient httpClient, IConfiguration configuration, ILogger<SePayService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<SePayCheckoutResponse?> CreateCheckoutUrlAsync(Guid orderId, decimal amount, string description, CancellationToken cancellationToken = default)
    {
        try
        {
            var accountNumber = _configuration["SePay:AccountNumber"] ?? "YOUR_ACC_NUMBER";
            var bankBin = _configuration["SePay:BankBin"] ?? "YOUR_BANK_BIN";

            // SePay/VND typically requires whole numbers. 
            // Using long to ensure no decimal points in the JSON payload.
            var roundedAmount = (long)Math.Round(amount);

            // Use dl.vietqr.io for universal mobile deep-linking to banking apps
            var checkoutUrl = $"https://dl.vietqr.io/pay?app={bankBin}&ba={accountNumber}&am={roundedAmount}&tn={Uri.EscapeDataString(description)}";
            var qrCodeUrl = $"https://qr.sepay.vn/img?acc={accountNumber}&bank={bankBin}&amount={roundedAmount}&des={Uri.EscapeDataString(description)}";

            return await Task.FromResult(new SePayCheckoutResponse
            {
                Success = true,
                CheckoutUrl = checkoutUrl,
                QrCode = qrCodeUrl,
                Message = "Success"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SEPAY] Unexpected exception while creating checkout URL for Order: {OrderId}", orderId);
            return new SePayCheckoutResponse { Success = false, Message = ex.Message };
        }
    }

    private class SePayApiResponse
    {
        public int Status { get; set; }
        public SePayApiData? Data { get; set; }
        public SePayApiError? Error { get; set; }
    }

    private class SePayApiData
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string QrCode { get; set; } = string.Empty;
    }

    private class SePayApiError
    {
        public string Message { get; set; } = string.Empty;
    }
}
