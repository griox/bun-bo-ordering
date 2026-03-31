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
        _logger.LogInformation("[SEPAY] Webhook received. RAW JSON: {RawJson}", rawJson);

        SePayWebhookPayload payload;
        try 
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawJson, options) ?? new SePayWebhookPayload();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SEPAY] Deserialization failure. Raw: {RawJson}", rawJson);
            return BadRequest(new { error = "Invalid JSON format", details = ex.Message });
        }

        // Authentication
        var signature = Request.Headers["X-Signature"].ToString();
        var authHeader = Request.Headers["Authorization"].ToString();
        _logger.LogInformation("[SEPAY] Auth info - Signature: {Sig}, AuthHeader: {Auth}", signature, authHeader);

        if (string.IsNullOrEmpty(signature) && !string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
        {
            var apiKey = authHeader.Substring(7);
            var secretKey = _configuration["SePay:SecretKey"] ?? "Bunbopaymentsupersecret16032004@";
            if (apiKey == secretKey)
            {
                _logger.LogInformation("[SEPAY] API Key validated successfully.");
                signature = "api-key-validated";
            }
            else 
            {
                _logger.LogWarning("[SEPAY] API Key mismatch. Expected: {Exp}, Got: {Got}", secretKey, apiKey);
            }
        }
        
        if (string.IsNullOrEmpty(signature))
        {
            _logger.LogWarning("[SEPAY] No valid signature or API Key found in headers.");
            signature = "unknown-signature";
        }
        
        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        // Find Order ID
        Guid validOrderId = Guid.Empty;
        if (!string.IsNullOrEmpty(payload.referenceCode) && Guid.TryParse(payload.referenceCode, out validOrderId))
        {
            _logger.LogInformation("[SEPAY] Using Order ID from referenceCode: {OrderId}", validOrderId);
        }
        else 
        {
            _logger.LogInformation("[SEPAY] referenceCode was not a valid GUID ('{Ref}'). Searching in content...", payload.referenceCode);
            var match = Regex.Match(payload.content ?? "", @"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
            
            if (match.Success && Guid.TryParse(match.Value, out validOrderId))
            {
                _logger.LogInformation("[SEPAY] Extracted Order ID from content: {OrderId}", validOrderId);
            }
            else
            {
                _logger.LogWarning("[SEPAY] No valid GUID found in content: {Content}", payload.content);
                return BadRequest(new { error = "Order ID not found in payload", content = payload.content });
            }
        }

        var command = new ProcessPaymentWebhookCommand(
            orderId: validOrderId,
            providerTransactionId: payload.id.ToString(),
            amount: payload.transferAmount,
            status: isSuccess ? "Success" : "Failed",
            signature: signature
        );

        _logger.LogInformation("[SEPAY] Sending command to Mediator for Order: {OrderId}", validOrderId);
        var result = await _mediator.Send(command);

        if (!result)
        {
            _logger.LogWarning("[SEPAY] Command refused. Likely missing transaction record or invalid signature for Order: {OrderId}", validOrderId);
            return BadRequest(new { error = "Command refused by handler. Check logs for validation or database issues." });
        }

        _logger.LogInformation("[SEPAY] Webhook processed successfully for Order: {OrderId}", validOrderId);
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
    public long id { get; set; }
    public string gateway { get; set; } = string.Empty;
    public string transactionDate { get; set; } = string.Empty;
    public string accountNumber { get; set; } = string.Empty;
    public string code { get; set; } = string.Empty;
    public string content { get; set; } = string.Empty; 
    public string transferType { get; set; } = string.Empty;
    public decimal transferAmount { get; set; }
    public decimal accumulated { get; set; }
    public string subAccount { get; set; } = string.Empty;
    public string referenceCode { get; set; } = string.Empty;
    public string description { get; set; } = string.Empty;
}
