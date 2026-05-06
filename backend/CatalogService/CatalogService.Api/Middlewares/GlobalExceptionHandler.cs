using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using BunBo.SharedKernel;

namespace CatalogService.Api.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "An unhandled exception occurred in CatalogService: {Message}", exception.Message);

        var problemDetails = new ProblemDetails
        {
            Instance = httpContext.Request.Path
        };

        if (exception is DomainException domainException)
        {
            problemDetails.Title = "Business Logic Error";
            problemDetails.Status = StatusCodes.Status400BadRequest;
            problemDetails.Detail = domainException.Message;
        }
        else
        {
            problemDetails.Title = "Server Error";
            problemDetails.Status = StatusCodes.Status500InternalServerError;
            problemDetails.Detail = "An unexpected error occurred in CatalogService.";
            
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
