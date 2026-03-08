#!/bin/bash
echo "Stopping all microservices holding port 5000->5004..."

# Kill processes by port to avoid 'Address already in use'
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5002 | xargs kill -9 2>/dev/null
lsof -ti:50022 | xargs kill -9 2>/dev/null
lsof -ti:5003 | xargs kill -9 2>/dev/null
lsof -ti:5004 | xargs kill -9 2>/dev/null
lsof -ti:5005 | xargs kill -9 2>/dev/null

echo "Starting Identity Service..."
(cd IdentityService/IdentityService.Api && dotnet run > /dev/null 2>&1) &

echo "Starting Catalog Service..."
(cd CatalogService/CatalogService.Api && dotnet run > /dev/null 2>&1) &

echo "Starting Cart Service..."
(cd CartService/CartService.Api && dotnet run > /dev/null 2>&1) &

echo "Starting Order Service..."
(cd OrderService/OrderService.Api && dotnet run > /dev/null 2>&1) &

echo "Starting Realtime Service..."
(cd RealtimeService/RealtimeService.Api && dotnet run > /dev/null 2>&1) &

echo "Starting API Gateway..."
(cd ApiGateway && dotnet run > /dev/null 2>&1) &

echo "✅ All services started successfully in the background!"
echo "Check logs later if needed, or simply run 'stop-all.sh' to terminate them all."
