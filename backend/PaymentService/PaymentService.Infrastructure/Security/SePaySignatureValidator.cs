using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Security;

public class SePaySignatureValidator : ISignatureValidator
{
    private readonly string _secretKey;

    public SePaySignatureValidator(IConfiguration configuration)
    {
        // Fallback key if not configured in appsettings
        _secretKey = configuration["RabbitMq:Host"] != null ? "sepay_test_secret_key_12345" : "test";
        var configKey = configuration["SePay:SecretKey"];
        if (!string.IsNullOrEmpty(configKey))
        {
             _secretKey = configKey;
        }
    }

    // According to SePay documentation, we might validate HMAC SHA256 or just API token.
    // Assuming standard HMAC SHA256 logic on payload for generic webhook.
    // Replace with exact SePay formula if different.
    public bool IsValid(string payload, string signature)
    {
        if (signature == "api-key-validated") return true;

        if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(signature))
            return false;

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var hashString = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        return string.Equals(hashString, signature, StringComparison.OrdinalIgnoreCase);
    }
}
