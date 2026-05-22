#!/bin/bash
# Description: Health check API and send Telegram notification if down
# Usage: ./health_check.sh

# TODO: Thay đổi URL thành endpoint thực tế của hệ thống (YARP Gateway hoặc Frontend)
URL="https://api.bun-bo-chung-cu.io.vn/health" 

# TODO: Điền Token và Chat ID của bot Telegram vào đây
TELEGRAM_BOT_TOKEN="8733068497:AAFFD2fA99lpOiOTtFmafzfIPP8Q_xFPoyc"
TELEGRAM_CHAT_ID="5295587921"

echo "🔍 Checking health of $URL..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" --connect-timeout 5)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ System is healthy (HTTP $HTTP_STATUS)."
else
    echo "❌ System is down or unreachable (HTTP $HTTP_STATUS)!"
    
    # Send Telegram notification if token and chat ID are configured
    if [[ "$TELEGRAM_BOT_TOKEN" != "YOUR_TELEGRAM_BOT_TOKEN" ]]; then
        MESSAGE="🚨 *BUNBO ALARM* 🚨%0A%0ASystem health check failed!%0AURL: $URL%0AStatus: HTTP $HTTP_STATUS%0ATime: $(date +"%Y-%m-%d %H:%M:%S")"
        
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${MESSAGE}" \
            -d parse_mode="Markdown" > /dev/null
            
        echo "📤 Telegram notification sent."
    else
        echo "⚠️ Telegram bot not configured. Please edit the script to add your bot token."
    fi
fi
