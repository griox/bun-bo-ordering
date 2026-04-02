using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Exceptions;

namespace BunBo.SharedKernel;

public static class LoggingExtensions
{
    public static void AddSerilogLogging(this IHostBuilder host, string applicationName)
    {
        host.UseSerilog((context, loggerConfiguration) =>
        {
            var seqUrl = context.Configuration["Serilog:SeqUrl"] ?? "http://seq:5341";
            var environment = context.HostingEnvironment.EnvironmentName;

            loggerConfiguration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .Enrich.WithExceptionDetails()
                .Enrich.WithMachineName()
                .Enrich.WithProcessId()
                .Enrich.WithThreadId()
                .Enrich.WithProperty("Application", applicationName)
                .Enrich.WithProperty("Environment", environment);

            // Console output for Docker/Kubernetes logs
            loggerConfiguration.WriteTo.Console();

            // Seq for centralized structured logging
            if (!string.IsNullOrEmpty(seqUrl))
            {
                loggerConfiguration.WriteTo.Seq(seqUrl);
            }

            // Read from configuration for further overrides
            loggerConfiguration.ReadFrom.Configuration(context.Configuration);
        });
    }
}
