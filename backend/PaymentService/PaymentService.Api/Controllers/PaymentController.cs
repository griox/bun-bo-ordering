using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands;
using Microsoft.Extensions.Logging;

using Microsoft.AspNetCore.RateLimiting;
using BunBo.SharedKernel;

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
    [EnableRateLimiting("payment-request")]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
    {
        var userIdStr = User.FindFirst("sub")?.Value 
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Guid? customerId = null;
        if (Guid.TryParse(userIdStr, out var parsedId)) customerId = parsedId;

        if (customerId == null && !string.IsNullOrEmpty(request.VoucherCode))
        {
            throw new DomainException("Khách vãng lai không được phép sử dụng voucher.");
        }

        var command = new CreatePaymentCommand(request.OrderId, request.Amount, "SePay", customerId, request.VoucherCode, request.TableSessionId, request.TableNumber, request.Note);
        var result = await _mediator.Send(command);

        if (result == null || !result.Success)
        {
            throw new DomainException(result?.Message ?? "Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.");
        }

        return Ok(result);
    }

    [HttpPost("webhook/sepay")]
    [ServiceFilter(typeof(PaymentService.Api.Filters.SePayWebhookAuthFilter))]
    public async Task<IActionResult> SePayWebhook(
        [FromBody] PaymentService.Application.Models.SePayWebhookPayload payload,
        [FromServices] PaymentService.Application.Interfaces.IWebhookParserService webhookParserService)
    {
        var validOrderId = webhookParserService.ExtractOrderId(payload);

        if (validOrderId == null)
        {
            return BadRequest(new { error = "Order ID not found in payload." });
        }

        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        var signature = HttpContext.Items["SePaySignature"]?.ToString() ?? string.Empty;

        var command = new ProcessPaymentWebhookCommand(
            orderId: validOrderId.Value,
            providerTransactionId: payload.id.ToString(),
            amount: payload.transferAmount,
            status: isSuccess ? "Success" : "Failed",
            signature: signature
        );

        _logger.LogInformation("[SEPAY] Processing webhook for Order: {OrderId}, Status: {Status}", validOrderId.Value, command.Status);
        var result = await _mediator.Send(command);

        if (!result)
        {
            _logger.LogWarning("[SEPAY] Command rejected for Order: {OrderId}", validOrderId.Value);
            return BadRequest(new { error = "Command rejected. Check server logs." });
        }

        _logger.LogInformation("[SEPAY] Webhook processed successfully for Order: {OrderId}", validOrderId.Value);
        return Ok(new { success = true });
    }
}

public class CreatePaymentRequest
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? VoucherCode { get; set; }
    public Guid? TableSessionId { get; set; }
    public string? TableNumber { get; set; }
    public string? Note { get; set; }
}
