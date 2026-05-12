using System;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Interfaces;
using PaymentService.Application.Models;

namespace PaymentService.Infrastructure.Services;

public class SePayWebhookParserService : IWebhookParserService
{
    private readonly ILogger<SePayWebhookParserService> _logger;

    public SePayWebhookParserService(ILogger<SePayWebhookParserService> logger)
    {
        _logger = logger;
    }

    public Guid? ExtractOrderId(SePayWebhookPayload payload)
    {
        if (!string.IsNullOrEmpty(payload.referenceCode) && Guid.TryParse(payload.referenceCode, out var validOrderId))
        {
            _logger.LogInformation("[SEPAY] Order ID from referenceCode: {OrderId}", validOrderId);
            return validOrderId;
        }

        _logger.LogInformation("[SEPAY] Searching for Order ID in content field.");
        var match = Regex.Match(payload.content ?? "", @"[a-fA-F0-9]{8}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{4}-?[a-fA-F0-9]{12}");

        if (match.Success && Guid.TryParse(match.Value, out validOrderId))
        {
            _logger.LogInformation("[SEPAY] Extracted Order ID from content: {OrderId}", validOrderId);
            return validOrderId;
        }

        _logger.LogWarning("[SEPAY] No valid Order GUID found in payload.");
        return null;
    }
}
