FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["IdentityService/IdentityService.Api/IdentityService.Api.csproj", "IdentityService/IdentityService.Api/"]
COPY ["IdentityService/IdentityService.Application/IdentityService.Application.csproj", "IdentityService/IdentityService.Application/"]
COPY ["IdentityService/IdentityService.Domain/IdentityService.Domain.csproj", "IdentityService/IdentityService.Domain/"]
COPY ["IdentityService/IdentityService.Infrastructure/IdentityService.Infrastructure.csproj", "IdentityService/IdentityService.Infrastructure/"]
COPY ["BunBo.SharedKernel/BunBo.SharedKernel.csproj", "BunBo.SharedKernel/"]

RUN dotnet restore "IdentityService/IdentityService.Api/IdentityService.Api.csproj"

# Copy source — only relevant service dirs to preserve layer cache
COPY IdentityService/ IdentityService/
COPY BunBo.SharedKernel/ BunBo.SharedKernel/
WORKDIR "/src/IdentityService/IdentityService.Api"
RUN dotnet build "IdentityService.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IdentityService.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

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

ENTRYPOINT ["dotnet", "IdentityService.Api.dll"]
