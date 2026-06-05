#!/bin/bash
docker exec bunbo-postgres psql -U root -d BunBoPromotionDb -c "SELECT * FROM \"LoyaltyPoints\" WHERE \"UserId\" = 'e1b5e799-7bf6-4ace-9fe3-ae77d8d2660d';" > /tmp/loyalty_points.txt
