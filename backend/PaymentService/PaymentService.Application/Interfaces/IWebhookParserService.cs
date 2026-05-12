using System;
using PaymentService.Application.Models;

namespace PaymentService.Application.Interfaces;

public interface IWebhookParserService
{
    Guid? ExtractOrderId(SePayWebhookPayload payload);
}
