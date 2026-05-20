FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine3.21 AS build
WORKDIR /src

# Give grpc tools the native libs it needs
RUN apk add --no-cache libc6-compat libstdc++

# Copy csproj and restore as distinct layers
COPY ["PromotionService/PromotionService.Api/PromotionService.Api.csproj", "PromotionService/PromotionService.Api/"]
COPY ["PromotionService/PromotionService.Application/PromotionService.Application.csproj", "PromotionService/PromotionService.Application/"]
COPY ["PromotionService/PromotionService.Domain/PromotionService.Domain.csproj", "PromotionService/PromotionService.Domain/"]
COPY ["PromotionService/PromotionService.Infrastructure/PromotionService.Infrastructure.csproj", "PromotionService/PromotionService.Infrastructure/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "PromotionService/PromotionService.Api/PromotionService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY PromotionService/ PromotionService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/PromotionService/PromotionService.Api"
RUN dotnet build "PromotionService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PromotionService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine3.21 AS final
WORKDIR /app
EXPOSE 8080

# Create a non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -S -D appuser && \
    chown -R appuser:appgroup /app

USER appuser

COPY --from=publish --chown=appuser:appgroup /app/publish .

ENTRYPOINT ["dotnet", "PromotionService.Api.dll"]
