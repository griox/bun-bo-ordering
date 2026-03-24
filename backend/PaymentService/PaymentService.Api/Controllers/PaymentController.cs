using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PaymentService.Application.Commands;

namespace PaymentService.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentController(IMediator mediator)
    {
        _mediator = mediator;
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
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookPayload payload)
    {
        // Retrieve signature from header context
        var signature = Request.Headers["X-Signature"].ToString() ?? "mock-signature";
        
        // Use generic success logic: if there's no error code or the string matches success
        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        // SePay might store our orderId in referenceCode OR in the transfer content
        if (!Guid.TryParse(payload.referenceCode, out Guid validOrderId))
        {
            // Try extracting from content (e.g. "THANHTOAN 550e8400-...")
            var parts = payload.content?.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            bool found = false;
            if (parts != null)
            {
                foreach (var part in parts)
                {
                    if (Guid.TryParse(part, out validOrderId))
                    {
                        found = true;
                        break;
                    }
                }
            }

            if (!found)
            {
                return BadRequest("Could not find a valid Order ID in referenceCode or content");
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
