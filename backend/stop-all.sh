#!/bin/bash
echo "Stopping all microservices holding port 5000->5004..."

# Kill processes by port to ensure clean shutdown
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5002 | xargs kill -9 2>/dev/null
lsof -ti:50022 | xargs kill -9 2>/dev/null
lsof -ti:5003 | xargs kill -9 2>/dev/null
lsof -ti:5004 | xargs kill -9 2>/dev/null
lsof -ti:5005 | xargs kill -9 2>/dev/null

echo "✅ All services have been stopped."
