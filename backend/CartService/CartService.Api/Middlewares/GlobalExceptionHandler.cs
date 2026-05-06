using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using BunBo.SharedKernel;

namespace CartService.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "An unhandled exception occurred in CartService: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path
        };

        if (exception is DomainException domainException)
        {
            problemDetails.Title = "Domain Error";
            problemDetails.Status = StatusCodes.Status400BadRequest;
            problemDetails.Detail = domainException.Message;
        }
        else if (exception is Grpc.Core.RpcException)
        {
            problemDetails.Title = "Service Unavailable";
            problemDetails.Status = StatusCodes.Status503ServiceUnavailable;
            problemDetails.Detail = "Lỗi kết nối đến dịch vụ Catalog. Vui lòng thử lại sau.";
        }
        else
        {
            problemDetails.Title = "Server Error";
            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Detail = "An unexpected error occurred in CartService.";
            
            if (httpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                problemDetails.Detail = exception.Message;
                problemDetails.Extensions["stackTrace"] = exception.StackTrace;
            }
        }

        httpContext.Response.StatusCode = problemDetails.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
