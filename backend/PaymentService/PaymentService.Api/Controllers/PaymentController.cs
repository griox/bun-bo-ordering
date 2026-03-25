using System.Text.Json;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands;
using Microsoft.Extensions.Logging;

namespace PaymentService.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly ILogger<PaymentController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IMediator _mediator;

    public PaymentController(IMediator mediator, ILogger<PaymentController> logger, IConfiguration configuration)
    {
        _mediator = mediator;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
    {
        var command = new CreatePaymentCommand(request.OrderId, request.Amount, "SePay");
        await _mediator.Send(command);
        
        // Frontend will generate VietQR explicitly, just return Ok
        return Ok(new { success = true, OrderId = request.OrderId, Amount = request.Amount });
    }

    // SePay standard webhook HTTP POST
    [HttpPost("webhook/sepay")]
    public async Task<IActionResult> SePayWebhook([FromBody] JsonElement rawPayload)
    {
        var rawJson = rawPayload.GetRawText();
        _logger.LogInformation("RAW SePay Webhook received: {RawJson}", rawJson);

        SePayWebhookPayload payload;
        try 
        {
            payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawJson) ?? new SePayWebhookPayload();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deserialize SePay payload: {RawJson}", rawJson);
            return BadRequest("Invalid JSON format for SePay payload");
        }

        // SePay supports two types of authentication:
        // 1. X-Signature: HMAC SHA256 of the payload (more secure)
        // 2. Authorization: "Apikey <API_KEY>" (simple direct match)
        var signature = Request.Headers["X-Signature"].ToString();
        var authHeader = Request.Headers["Authorization"].ToString();
        bool isApiKeyMatch = false;

        if (string.IsNullOrEmpty(signature) && !string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
        {
            var apiKey = authHeader.Substring(7);
            // Get secret key from config to compare
            var secretKey = _configuration["SePay:SecretKey"] ?? "Bunbopaymentsupersecret16032004@";
            isApiKeyMatch = apiKey == secretKey;
            
            // If it matches, we can treat the "apiKey" as a valid signature for the command 
            // BUT we must skip the HMAC check in the handler or pass a flag.
            // For now, let's just use a special mock signature that the validator will recognize?
            // Or better: pass the signature as is and update the validator.
            signature = isApiKeyMatch ? "api-key-validated" : apiKey;
        }
        
        if (string.IsNullOrEmpty(signature)) signature = "mock-signature";
        
        // Use generic success logic: if there's no error code or the string matches success
        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        _logger.LogInformation("Processing SePay Webhook. Content: {Content}, Amount: {Amount}, Reference: {Reference}", 
            payload.content, payload.transferAmount, payload.referenceCode);

        // SePay might store our orderId in referenceCode OR in the transfer content
        if (!Guid.TryParse(payload.referenceCode, out Guid validOrderId))
        {
            _logger.LogInformation("ReferenceCode not a GUID. Trying to extract from content via Regex...");
            
            // Try extracting GUID anywhere in the content using Regex
            var match = Regex.Match(payload.content ?? "", @"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
            
            if (match.Success && Guid.TryParse(match.Value, out validOrderId))
            {
                _logger.LogInformation("Found valid Order ID via Regex: {OrderId}", validOrderId);
            }
            else
            {
                // Fallback to splitting by space just in case (e.g. if the bank messed up the dashes - unlikely but possible)
                var parts = payload.content?.Split(new[] { ' ', '.', ':', '|' }, StringSplitOptions.RemoveEmptyEntries);
                bool found = false;
                if (parts != null)
                {
                    foreach (var part in parts)
                    {
                        if (Guid.TryParse(part, out validOrderId))
                        {
                            _logger.LogInformation("Found valid Order ID in content parts: {OrderId}", validOrderId);
                            found = true;
                            break;
                        }
                    }
                }

                if (!found)
                {
                    _logger.LogWarning("Webhook rejected: Could not find a valid Order ID in referenceCode or content. Content was: {Content}", payload.content);
                    return BadRequest("Could not find a valid Order ID in referenceCode or content");
                }
            }
        }

        var command = new ProcessPaymentWebhookCommand(
            orderId: validOrderId,
            providerTransactionId: payload.id.ToString(),
            amount: payload.transferAmount,
            status: isSuccess ? "Success" : "Failed",
            signature: signature
        );

        var result = await _mediator.Send(command);

        if (!result)
        {
            _logger.LogWarning("Webhook processing failed (Validation or Business logic) for Order: {OrderId}", validOrderId);
            return BadRequest("Signature validation or processing failed");
        }

        return Ok(new { success = true });
    }
}

public class CreatePaymentRequest
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
}

public class SePayWebhookPayload
{
    // Real SePay payload structure (approximate model based on standard documentation)
    public int id { get; set; }
    public string gateway { get; set; } = string.Empty;
    public string transactionDate { get; set; } = string.Empty;
    public string accountNumber { get; set; } = string.Empty;
    public string code { get; set; } = string.Empty;
    public string content { get; set; } = string.Empty; // Where the customer puts "THANHTOAN ORDERID"
    public string transferType { get; set; } = string.Empty;
    public decimal transferAmount { get; set; }
    public decimal accumulated { get; set; }
    public string subAccount { get; set; } = string.Empty;
    public string referenceCode { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
}
