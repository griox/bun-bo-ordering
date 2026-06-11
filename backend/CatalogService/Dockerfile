FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Give grpc tools the native libs it needs
RUN apk add --no-cache libc6-compat libstdc++

# Copy csproj and restore as distinct layers
COPY ["CatalogService/CatalogService.Api/CatalogService.Api.csproj", "CatalogService/CatalogService.Api/"]
COPY ["CatalogService/CatalogService.Application/CatalogService.Application.csproj", "CatalogService/CatalogService.Application/"]
COPY ["CatalogService/CatalogService.Domain/CatalogService.Domain.csproj", "CatalogService/CatalogService.Domain/"]
COPY ["CatalogService/CatalogService.Infrastructure/CatalogService.Infrastructure.csproj", "CatalogService/CatalogService.Infrastructure/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "CatalogService/CatalogService.Api/CatalogService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY CatalogService/ CatalogService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/CatalogService/CatalogService.Api"
RUN dotnet build "CatalogService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CatalogService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
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

ENTRYPOINT ["dotnet", "CatalogService.Api.dll"]
