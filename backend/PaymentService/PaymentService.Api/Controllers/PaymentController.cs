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

    // A mock endpoint for creating payment links. In real world, this calls sePay/MoMo
    [HttpPost]
    public IActionResult CreatePayment([FromBody] CreatePaymentRequest request)
    {
        // For demonstration, simply generates a mock link
        var mockUrl = $"https://checkout.sepay.vn/xyz?orderId={request.OrderId}&amount={request.Amount}";
        return Ok(new { PaymentUrl = mockUrl, OrderId = request.OrderId });
    }

    [HttpPost("webhook/sepay")]
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookPayload payload)
    {
        // Webhook structure according to generic rules or SePay
        // This is simplified. Assume OrderId is in Reference or extracted.
        // Assuming payload has OrderId directly for this implementation schema
        
        var signature = Request.Headers["X-Signature"].ToString() ?? "mock-signature";
        
        var command = new ProcessPaymentWebhookCommand(
            orderId: payload.OrderId,
            providerTransactionId: payload.TransactionId,
            amount: payload.Amount,
            status: payload.Status,
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
    public Guid OrderId { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}
