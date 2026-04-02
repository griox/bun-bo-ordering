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
            var apiKey = _configuration["SePay:ApiKey"] ?? "YOUR_SEPAY_API_KEY";
            var accountNumber = _configuration["SePay:AccountNumber"] ?? "YOUR_ACC_NUMBER";
            var bankBin = _configuration["SePay:BankBin"] ?? "YOUR_BANK_BIN";

            // SePay/VND typically requires whole numbers. 
            // Using long to ensure no decimal points in the JSON payload.
            var roundedAmount = (long)Math.Round(amount);

            var requestBody = new
            {
                account_number = accountNumber,
                amount = roundedAmount,
                bank_bin = bankBin,
                description = description,
                order_id = orderId.ToString()
            };

            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsJsonAsync("https://api.sepay.vn/v1/checkout/create", requestBody, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("[SEPAY] API Error: {Status} - {Error}", response.StatusCode, responseBody);
                return new SePayCheckoutResponse { Success = false, Message = $"SePay Error: {response.StatusCode}" };
            }

            try 
            {
                var content = JsonSerializer.Deserialize<SePayApiResponse>(responseBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (content?.Status == 200 && content.Data != null)
                {
                    return new SePayCheckoutResponse
                    {
                        Success = true,
                        CheckoutUrl = content.Data.CheckoutUrl,
                        QrCode = content.Data.QrCode,
                        Message = "Success"
                    };
                }

                return new SePayCheckoutResponse { Success = false, Message = content?.Error?.Message ?? "Unknown SePay business error" };
            }
            catch (JsonException jex)
            {
                _logger.LogError(jex, "[SEPAY] Failed to parse JSON response. Body: {Body}", responseBody);
                return new SePayCheckoutResponse { Success = false, Message = "Invalid response format from SePay" };
            }
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
