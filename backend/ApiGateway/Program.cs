var builder = WebApplication.CreateBuilder(args);

// Add Yarp reverse proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.MapReverseProxy();

app.MapGet("/", () => "API Gateway is running.");

app.Run();
