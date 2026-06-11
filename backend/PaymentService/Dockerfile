FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy csproj and restore
COPY ["PaymentService/PaymentService.Api/PaymentService.Api.csproj", "PaymentService/PaymentService.Api/"]
COPY ["PaymentService/PaymentService.Application/PaymentService.Application.csproj", "PaymentService/PaymentService.Application/"]
COPY ["PaymentService/PaymentService.Domain/PaymentService.Domain.csproj", "PaymentService/PaymentService.Domain/"]
COPY ["PaymentService/PaymentService.Infrastructure/PaymentService.Infrastructure.csproj", "PaymentService/PaymentService.Infrastructure/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "PaymentService/PaymentService.Api/PaymentService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY PaymentService/ PaymentService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/PaymentService/PaymentService.Api"
RUN dotnet build "PaymentService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PaymentService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080

# Create a non-root user
RUN apk update && apk upgrade --no-cache && \
    addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -S -D appuser && \
    chown -R appuser:appgroup /app

USER appuser
COPY --from=publish --chown=appuser:appgroup /app/publish .
ENTRYPOINT ["dotnet", "PaymentService.Api.dll"]
