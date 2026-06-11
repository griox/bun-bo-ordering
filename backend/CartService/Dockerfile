FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Give grpc tools the native libs it needs
RUN apk add --no-cache libc6-compat libstdc++

# Copy csproj and restore as distinct layers
COPY ["CartService/CartService.Api/CartService.Api.csproj", "CartService/CartService.Api/"]
COPY ["CartService/CartService.Application/CartService.Application.csproj", "CartService/CartService.Application/"]
COPY ["CartService/CartService.Domain/CartService.Domain.csproj", "CartService/CartService.Domain/"]
COPY ["CartService/CartService.Infrastructure/CartService.Infrastructure.csproj", "CartService/CartService.Infrastructure/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "CartService/CartService.Api/CartService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY CartService/ CartService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/CartService/CartService.Api"
RUN dotnet build "CartService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CartService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

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

ENTRYPOINT ["dotnet", "CartService.Api.dll"]
