#!/bin/bash
docker logs bunbo-promotion > /tmp/promotion_logs.txt
docker exec bunbo-postgres psql -U root -d BunBoPromotionDb -c "SELECT * FROM \"PointTransactions\" ORDER BY \"CreatedAt\" DESC LIMIT 5;" > /tmp/promotion_db.txt
