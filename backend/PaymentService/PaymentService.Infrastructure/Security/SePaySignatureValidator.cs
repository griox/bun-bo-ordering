using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Interfaces;

namespace PaymentService.Infrastructure.Security;

public class SePaySignatureValidator : ISignatureValidator
{
    private readonly string _secretKey;
    private readonly ILogger<SePaySignatureValidator> _logger;

    public SePaySignatureValidator(IConfiguration configuration, ILogger<SePaySignatureValidator> logger)
    {
        _logger = logger;
        var configKey = configuration["SePay:SecretKey"];
        if (string.IsNullOrEmpty(configKey))
        {
            _logger.LogCritical("[SePaySignatureValidator] SePay:SecretKey is not configured. Webhook validation will always fail.");
            // Fail-secure: set a random key so all validations fail rather than falling back to a known key
            _secretKey = Guid.NewGuid().ToString("N");
        }
        else
        {
            _secretKey = configKey;
        }
    }

    /// <summary>
    /// Validates an HMAC-SHA256 signature using constant-time comparison to prevent timing attacks.
    /// </summary>
    public bool IsValid(string payload, string signature)
    {
        if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(signature))
        {
            _logger.LogWarning("[SePaySignatureValidator] Validation failed: payload or signature is empty.");
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var expectedHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
        var signatureBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());

        // Constant-time comparison to prevent timing attacks
        if (expectedBytes.Length != signatureBytes.Length)
        {
            _logger.LogWarning("[SePaySignatureValidator] Signature length mismatch.");
            return false;
        }

        var isValid = CryptographicOperations.FixedTimeEquals(expectedBytes, signatureBytes);
        if (!isValid)
        {
            _logger.LogWarning("[SePaySignatureValidator] Signature mismatch. Potential tampering detected.");
        }
        return isValid;
    }
}
