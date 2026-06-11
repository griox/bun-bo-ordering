using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Prometheus;

namespace BunBo.SharedKernel.Extensions
{
    public static class PrometheusExtensions
    {
        public static IServiceCollection AddBunBoPrometheusMetrics(this IServiceCollection services)
        {
            // prometheus-net provides standard .NET metrics out-of-the-box via app.UseHttpMetrics().
            // We can add custom metrics registration here if needed in the future.
            return services;
        }

        public static IApplicationBuilder UseBunBoPrometheusMetrics(this IApplicationBuilder app)
        {
            // Expose the /metrics endpoint
            app.UseMetricServer();
            
            // Track HTTP request metrics (duration, status codes, etc.)
            app.UseHttpMetrics(options =>
            {
                // Reduce cardinality: capture only the first component of the path, or disable path capture if highly dynamic.
                // For BunBo, we just use the default which groups by endpoint routing where possible.
            });

            return app;
        }
    }
}
