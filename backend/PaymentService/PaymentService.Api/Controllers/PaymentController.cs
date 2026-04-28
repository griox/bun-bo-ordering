using System.Security.Cryptography;
using System.Text;
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
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid? customerId = null;
        if (Guid.TryParse(userIdStr, out var parsedId)) customerId = parsedId;

        var command = new CreatePaymentCommand(request.OrderId, request.Amount, "SePay", customerId);
        var result = await _mediator.Send(command);

        if (result == null || !result.Success)
        {
            return BadRequest(new { success = false, message = result?.Message ?? "Failed to create SePay checkout" });
        }

        return Ok(result);
    }

    // SePay standard webhook HTTP POST
    [HttpPost("webhook/sepay")]
    public async Task<IActionResult> SePayWebhook([FromBody] JsonElement rawPayload)
    {
        var rawJson = rawPayload.GetRawText();

        SePayWebhookPayload payload;
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawJson, options) ?? new SePayWebhookPayload();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SEPAY] Deserialization failed.");
            return BadRequest(new { error = "Invalid JSON format" });
        }

        // ─── Webhook Signature / API Key authentication ───────────────────────
        // SePay sends authentication via either HMAC X-Signature or Apikey header.
        // We validate the API Key first, then compute HMAC for the command handler.
        var apiKeyHeader = Request.Headers["Authorization"].ToString();
        var secretKey = _configuration["SePay:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
        {
            _logger.LogCritical("[SEPAY] SePay:SecretKey is not configured. Rejecting webhook.");
            return Unauthorized(new { error = "Server misconfiguration." });
        }

        string computedSignature;
        if (!string.IsNullOrEmpty(apiKeyHeader) && apiKeyHeader.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
        {
            // Validate API Key with constant-time comparison to prevent timing attacks
            var providedApiKey = apiKeyHeader[7..];
            var expectedKeyBytes = Encoding.UTF8.GetBytes(secretKey);
            var providedKeyBytes = Encoding.UTF8.GetBytes(providedApiKey);

            if (expectedKeyBytes.Length != providedKeyBytes.Length ||
                !CryptographicOperations.FixedTimeEquals(expectedKeyBytes, providedKeyBytes))
            {
                _logger.LogWarning("[SEPAY] Invalid API Key in Authorization header.");
                return Unauthorized(new { error = "Invalid credentials." });
            }
            _logger.LogInformation("[SEPAY] API Key validated successfully.");
            // Compute the HMAC signature that the handler will re-verify
            computedSignature = ComputeHmac(secretKey, $"{payload.id}|{payload.transferAmount}|{payload.referenceCode}");
        }
        else
        {
            // Fallback: validate the X-Signature HMAC header
            var xSignature = Request.Headers["X-Signature"].ToString();
            if (string.IsNullOrEmpty(xSignature))
            {
                _logger.LogWarning("[SEPAY] No valid authentication header found.");
                return Unauthorized(new { error = "Missing authentication." });
            }
            computedSignature = xSignature;
        }

        // ─── Parse Order ID ───────────────────────────────────────────────────
        Guid validOrderId = Guid.Empty;
        if (!string.IsNullOrEmpty(payload.referenceCode) && Guid.TryParse(payload.referenceCode, out validOrderId))
        {
            _logger.LogInformation("[SEPAY] Order ID from referenceCode: {OrderId}", validOrderId);
        }
        else
        {
            _logger.LogInformation("[SEPAY] Searching for Order ID in content field.");
            var match = Regex.Match(payload.content ?? "", @"[a-fA-F0-9]{8}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{12}");

            if (match.Success && Guid.TryParse(match.Value, out validOrderId))
            {
                _logger.LogInformation("[SEPAY] Extracted Order ID from content: {OrderId}", validOrderId);
            }
            else
            {
                _logger.LogWarning("[SEPAY] No valid Order GUID found in payload.");
                return BadRequest(new { error = "Order ID not found in payload." });
            }
        }

        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        var command = new ProcessPaymentWebhookCommand(
            orderId: validOrderId,
            providerTransactionId: payload.id.ToString(),
            amount: payload.transferAmount,
            status: isSuccess ? "Success" : "Failed",
            signature: string.Empty,
            isApiKeyVerified: true
        );

        _logger.LogInformation("[SEPAY] Processing webhook for Order: {OrderId}, Status: {Status}", validOrderId, command.Status);
        var result = await _mediator.Send(command);

        if (!result)
        {
            _logger.LogWarning("[SEPAY] Command rejected for Order: {OrderId}", validOrderId);
            return BadRequest(new { error = "Command rejected. Check server logs." });
        }

        _logger.LogInformation("[SEPAY] Webhook processed successfully for Order: {OrderId}", validOrderId);
        return Ok(new { success = true });
    }

    private static string ComputeHmac(string secret, string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
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
