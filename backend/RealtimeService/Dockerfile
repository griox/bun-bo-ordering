FROM mcr.microsoft.com/dotnet/sdk:8.0-jammy AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["RealtimeService/RealtimeService.Api/RealtimeService.Api.csproj", "RealtimeService/RealtimeService.Api/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "RealtimeService/RealtimeService.Api/RealtimeService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY RealtimeService/ RealtimeService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/RealtimeService/RealtimeService.Api"
RUN dotnet build "RealtimeService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RealtimeService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080

# Create a non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app

USER appuser

COPY --from=publish --chown=appuser:appgroup /app/publish .

ENTRYPOINT ["dotnet", "RealtimeService.Api.dll"]
