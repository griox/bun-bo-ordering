using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Interfaces;
using PaymentService.Application.Models;

namespace PaymentService.Api.Filters;

public class SePayWebhookAuthFilter : IAsyncActionFilter
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SePayWebhookAuthFilter> _logger;
    private readonly ISignatureValidator _signatureValidator;

    public SePayWebhookAuthFilter(IConfiguration configuration, ILogger<SePayWebhookAuthFilter> logger, ISignatureValidator signatureValidator)
    {
        _configuration = configuration;
        _logger = logger;
        _signatureValidator = signatureValidator;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var secretKey = _configuration["SePay:SecretKey"];
        if (string.IsNullOrEmpty(secretKey))
        {
            _logger.LogCritical("[SEPAY] SePay:SecretKey is not configured. Rejecting webhook.");
            context.Result = new UnauthorizedObjectResult(new { error = "Server misconfiguration." });
            return;
        }

        var request = context.HttpContext.Request;
        
        // 1. Try API Key Authentication first
        var apiKeyHeader = request.Headers["Authorization"].ToString();
        if (!string.IsNullOrEmpty(apiKeyHeader) && apiKeyHeader.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase))
        {
            var providedApiKey = apiKeyHeader.Substring(7);
            var expectedKeyBytes = Encoding.UTF8.GetBytes(secretKey);
            var providedKeyBytes = Encoding.UTF8.GetBytes(providedApiKey);

            if (expectedKeyBytes.Length == providedKeyBytes.Length &&
                CryptographicOperations.FixedTimeEquals(expectedKeyBytes, providedKeyBytes))
            {
                _logger.LogInformation("[SEPAY] API Key validated successfully via Filter.");
                context.HttpContext.Items["SePaySignature"] = string.Empty;
                await next();
                return;
            }
            
            _logger.LogWarning("[SEPAY] Invalid API Key in Authorization header.");
            context.Result = new UnauthorizedObjectResult(new { error = "Invalid credentials." });
            return;
        }

        // 2. Fallback to HMAC X-Signature Authentication
        var xSignature = request.Headers["X-Signature"].ToString();
        if (string.IsNullOrEmpty(xSignature))
        {
            _logger.LogWarning("[SEPAY] No valid authentication header found.");
            context.Result = new UnauthorizedObjectResult(new { error = "Missing authentication." });
            return;
        }

        // Read the body for HMAC calculation
        request.EnableBuffering();
        string rawBody;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
            request.Body.Position = 0; // Rewind for model binder
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var payload = JsonSerializer.Deserialize<SePayWebhookPayload>(rawBody, options);
            
            if (payload == null)
            {
                _logger.LogWarning("[SEPAY] Invalid JSON body.");
                context.Result = new BadRequestObjectResult(new { error = "Invalid JSON format" });
                return;
            }

            var signaturePayload = $"{payload.id}|{payload.transferAmount}|{payload.referenceCode}";
            
            if (!_signatureValidator.IsValid(signaturePayload, xSignature))
            {
                _logger.LogWarning("[SEPAY] HMAC Signature mismatch.");
                context.Result = new UnauthorizedObjectResult(new { error = "Invalid signature." });
                return;
            }
            
            _logger.LogInformation("[SEPAY] HMAC Signature validated successfully via Filter.");
            context.HttpContext.Items["SePaySignature"] = xSignature;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[SEPAY] Deserialization failed in Filter.");
            context.Result = new BadRequestObjectResult(new { error = "Invalid JSON format" });
            return;
        }

        await next();
    }
}
