FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy SharedKernel first
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]
# Copy NotificationService
COPY ["NotificationService/NotificationService.Api/NotificationService.Api.csproj", "NotificationService/NotificationService.Api/"]

# Restore dependencies
RUN dotnet restore "NotificationService/NotificationService.Api/NotificationService.Api.csproj"

# Copy everything else
COPY . .
WORKDIR "/src/NotificationService/NotificationService.Api"
RUN dotnet build "NotificationService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NotificationService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -S -D appuser && \
    chown -R appuser:appgroup /app

USER appuser

COPY --from=publish --chown=appuser:appgroup /app/publish .
ENTRYPOINT ["dotnet", "NotificationService.Api.dll"]
