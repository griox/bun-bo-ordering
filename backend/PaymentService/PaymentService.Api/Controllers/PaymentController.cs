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
    public IActionResult CreatePayment([FromBody] CreatePaymentRequest request)
    {
        // For demonstration, simply generates a mock link
        var mockUrl = $"https://checkout.sepay.vn/xyz?orderId={request.OrderId}&amount={request.Amount}";
        return Ok(new { PaymentUrl = mockUrl, OrderId = request.OrderId });
    }

    // SePay standard webhook HTTP POST
    [HttpPost("webhook/sepay")]
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookPayload payload)
    {
        // Retrieve signature from header context
        var signature = Request.Headers["X-Signature"].ToString() ?? "mock-signature";
        
        // Use generic success logic: if there's no error code or the string matches success
        var isSuccess = string.IsNullOrWhiteSpace(payload.code) || payload.code.Equals("00", StringComparison.OrdinalIgnoreCase);

        // SePay might store our orderId in the description/content. Assuming we can extract it:
        // Or if SePay payload directly has referenceCode:
        if (!Guid.TryParse(payload.referenceCode, out Guid validOrderId))
        {
            // If we cannot parse referenceCode to Guid, try to parse from content
            // Very simplified extraction for the purpose of this example
            return BadRequest("Invalid Order ID format in Webhook");
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
