#!/bin/bash
# ================================================================
# k6-cleanup.sh — Dọn dẹp dữ liệu rác sau khi chạy k6 load test
# ================================================================
# Hệ thống BunBo Microservices — Database per Service
#
# Dữ liệu cần xóa:
#   [1] Orders có note 'k6-*'               → bunbo_order_db (OrderService)
#   [2] TableSessions của K6 tables         → bunbo_order_db
#   [3] Tables K6-T*                        → bunbo_order_db
#   [4] Member test accounts k6member*      → BunBoIdentityDb (IdentityService)
#   [5] Voucher K6_RACE_V1                  → BunBoPromotionDb (PromotionService)
#   [6] Redis cart data của K6 sessions     → Redis (CartService)
#   [7] Payments liên quan đến K6 orders   → bunbo_order_db (via PaymentService events)
#
# Cách dùng:
#   ./k6-cleanup.sh            — Xóa từng bước, hỏi xác nhận
#   ./k6-cleanup.sh --dry-run  — Chỉ hiển thị sẽ xóa gì, KHÔNG xóa
#   ./k6-cleanup.sh --yes      — Auto-confirm, không hỏi
# ================================================================

set -euo pipefail

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Flags ──
DRY_RUN=false
AUTO_YES=false
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --yes|-y)  AUTO_YES=true ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--yes]"
            echo "  --dry-run  Hiển thị sẽ xóa gì, không thực sự xóa"
            echo "  --yes      Tự động xác nhận, không hỏi"
            exit 0 ;;
    esac
done

# ── Config ──
NAMESPACE="default"
PG_POD_SELECTOR="app.kubernetes.io/name=postgresql"
PG_NS="postgresql"
REDIS_POD_SELECTOR="app.kubernetes.io/name=redis,app.kubernetes.io/component=master"
REDIS_NS="redis"
PG_USER="postgres"
PG_PASSWORD="bunbopw123!"
REDIS_PASSWORD="bunbopw123!"
ORDER_DB="bunbo_db"
IDENTITY_DB="bunbo_db"
PROMOTION_DB="bunbo_db"

# ── K6 test data markers ──
K6_ORDER_NOTE_PATTERN="k6-%"
K6_TABLE_CODE_PATTERN="K6-T%"
K6_MEMBER_PATTERN="k6member%"
K6_VOUCHER_CODE="K6_RACE_V1"

# ── Counters ──
TOTAL_DELETED=0
ERRORS=0

# ================================================================
# HELPERS
# ================================================================

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; ERRORS=$((ERRORS + 1)); }
log_dry()     { echo -e "${CYAN}[DRY]${NC}   $*"; }
log_section() { echo -e "\n${YELLOW}══════════════════════════════════════${NC}"; echo -e "${YELLOW}  $*${NC}"; echo -e "${YELLOW}══════════════════════════════════════${NC}"; }

confirm() {
    if $AUTO_YES || $DRY_RUN; then return 0; fi
    echo -en "${YELLOW}[?] $* (y/N): ${NC}"
    read -r reply
    [[ "$reply" =~ ^[Yy]$ ]]
}

# Tìm pod theo selector trong namespace
find_pod() {
    local selector="$1"
    local ns="${2:-default}"
    kubectl get pod -n "$ns" -l "$selector" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo ""
}

# Chạy SQL trên PostgreSQL pod
run_pg_sql() {
    local db="$1"
    local sql="$2"
    local pg_pod
    pg_pod=$(find_pod "$PG_POD_SELECTOR" "$PG_NS")

    if [[ -z "$pg_pod" ]]; then
        log_error "Không tìm thấy PostgreSQL pod (selector: $PG_POD_SELECTOR, ns: $PG_NS)"
        return 1
    fi

    kubectl exec -n "$PG_NS" "$pg_pod" -- \
        env PGPASSWORD="$PG_PASSWORD" \
        psql -U "$PG_USER" -d "$db" -t -c "$sql" 2>/dev/null | tr -d '[:space:]'
}

# Chạy SQL — trả về kết quả đầy đủ (nhiều dòng)
run_pg_sql_full() {
    local db="$1"
    local sql="$2"
    local pg_pod
    pg_pod=$(find_pod "$PG_POD_SELECTOR" "$PG_NS")

    if [[ -z "$pg_pod" ]]; then
        log_error "Không tìm thấy PostgreSQL pod"
        return 1
    fi

    kubectl exec -n "$PG_NS" "$pg_pod" -- \
        env PGPASSWORD="$PG_PASSWORD" \
        psql -U "$PG_USER" -d "$db" -c "$sql" 2>/dev/null
}

# Đếm rows sẽ bị xóa
count_pg() {
    local db="$1"
    local table="$2"
    local where="$3"
    run_pg_sql "$db" "SELECT COUNT(*) FROM \"$table\" WHERE $where;"
}

# Chạy DELETE (hoặc in ra nếu dry-run)
delete_pg() {
    local db="$1"
    local table="$2"
    local where="$3"
    local desc="$4"

    local count
    count=$(count_pg "$db" "$table" "$where" 2>/dev/null || echo "?")

    if $DRY_RUN; then
        log_dry "Would DELETE $count rows from [$db].$table WHERE $where"
        return 0
    fi

    if [[ "$count" == "0" ]]; then
        log_info "$desc — không có dữ liệu cần xóa"
        return 0
    fi

    log_info "$desc — chuẩn bị xóa $count rows..."
    local result
    result=$(run_pg_sql "$db" "DELETE FROM \"$table\" WHERE $where;")
    log_ok "$desc — đã xóa $count rows ✓"
    TOTAL_DELETED=$((TOTAL_DELETED + count))
}

# Chạy Redis command
run_redis_cmd() {
    local cmd="$*"
    local redis_pod
    redis_pod=$(find_pod "$REDIS_POD_SELECTOR" "$REDIS_NS")

    if [[ -z "$redis_pod" ]]; then
        # Thử tên pod redis khác
        redis_pod=$(kubectl get pod -n "$REDIS_NS" -o name 2>/dev/null | grep redis | head -1 | sed 's|pod/||')
    fi

    if [[ -z "$redis_pod" ]]; then
        log_warn "Không tìm thấy Redis pod — bỏ qua cleanup Redis"
        return 1
    fi

    kubectl exec -n "$REDIS_NS" "$redis_pod" -- redis-cli -a "$REDIS_PASSWORD" --no-auth-warning $cmd 2>/dev/null
}

# ================================================================
# PREFLIGHT CHECKS
# ================================================================
log_section "PREFLIGHT CHECKS"

# Kiểm tra kubectl
if ! command -v kubectl &>/dev/null; then
    log_error "kubectl không được cài đặt"
    exit 1
fi
log_ok "kubectl OK"

# Kiểm tra kết nối cluster
if ! kubectl cluster-info &>/dev/null; then
    log_error "Không thể kết nối K3s cluster. Kiểm tra kubeconfig."
    exit 1
fi
log_ok "K3s cluster reachable"

# Kiểm tra PostgreSQL pod
PG_POD=$(find_pod "$PG_POD_SELECTOR" "$PG_NS")
if [[ -z "$PG_POD" ]]; then
    log_warn "Không tìm thấy PostgreSQL pod với selector '$PG_POD_SELECTOR' trong namespace '$PG_NS'"
    log_warn "Thử tìm với namespace 'default'..."
    PG_NS="default"
    PG_POD=$(find_pod "$PG_POD_SELECTOR" "$PG_NS")
    if [[ -z "$PG_POD" ]]; then
        log_error "Không tìm thấy PostgreSQL pod. Kiểm tra: kubectl get pods -A | grep postgres"
        log_info "Bạn có thể chạy cleanup thủ công — xem phần 'MANUAL CLEANUP' ở cuối script"
        ERRORS=$((ERRORS + 1))
    fi
fi
[[ -n "$PG_POD" ]] && log_ok "PostgreSQL pod: $PG_POD (ns: $PG_NS)"

if $DRY_RUN; then
    log_warn "=== CHẾ ĐỘ DRY RUN — Không xóa dữ liệu thực tế ==="
fi

# ================================================================
# SECTION 1: ORDER SERVICE — bunbo_order_db
# ================================================================
log_section "1. ORDER SERVICE (bunbo_order_db)"

# 1a. Đếm preview trước khi xóa
if [[ -n "$PG_POD" ]]; then
    log_info "Preview dữ liệu K6 trong OrderDB:"
    run_pg_sql_full "$ORDER_DB" "
        SELECT
            (SELECT COUNT(*) FROM \"Orders\" WHERE \"Note\" LIKE '$K6_ORDER_NOTE_PATTERN') AS k6_orders,
            (SELECT COUNT(*) FROM \"RestaurantTables\" WHERE \"TableCode\" LIKE '$K6_TABLE_CODE_PATTERN') AS k6_tables,
            (SELECT COUNT(*) FROM \"TableSessions\" ts
             JOIN \"RestaurantTables\" rt ON ts.\"TableId\" = rt.\"Id\"
             WHERE rt.\"TableCode\" LIKE '$K6_TABLE_CODE_PATTERN') AS k6_sessions;
    " 2>/dev/null || log_warn "Không thể preview OrderDB"
fi

confirm "Xóa dữ liệu K6 trong OrderDB?" || { log_warn "Bỏ qua OrderDB cleanup"; }

if [[ -n "$PG_POD" ]] && (confirm "Xác nhận xóa Orders, TableSessions, Tables?" || $AUTO_YES || $DRY_RUN); then
    # 1. Xóa OrderItems của K6 orders trước (FK constraint)
    delete_pg "$ORDER_DB" "OrderItems" \
        "\"OrderId\" IN (SELECT \"Id\" FROM \"Orders\" WHERE \"Note\" LIKE '$K6_ORDER_NOTE_PATTERN')" \
        "OrderItems của K6 orders"

    # 2. Xóa K6 Orders
    delete_pg "$ORDER_DB" "Orders" \
        "\"Note\" LIKE '$K6_ORDER_NOTE_PATTERN'" \
        "Orders K6 (note LIKE 'k6-%')"

    # 3. Xóa TableSessions của K6 tables
    delete_pg "$ORDER_DB" "TableSessions" \
        "\"TableId\" IN (SELECT \"Id\" FROM \"RestaurantTables\" WHERE \"TableCode\" LIKE '$K6_TABLE_CODE_PATTERN')" \
        "TableSessions của K6 tables"

    # 4. Xóa K6 Tables
    delete_pg "$ORDER_DB" "RestaurantTables" \
        "\"TableCode\" LIKE '$K6_TABLE_CODE_PATTERN'" \
        "RestaurantTables K6 (code LIKE 'K6-T%')"
fi

# ================================================================
# SECTION 2: IDENTITY SERVICE — BunBoIdentityDb
# ================================================================
log_section "2. IDENTITY SERVICE (BunBoIdentityDb)"

if [[ -n "$PG_POD" ]]; then
    log_info "Preview tài khoản K6 trong IdentityDB:"
    run_pg_sql_full "$IDENTITY_DB" "
        SELECT \"Username\", \"Email\", \"CreatedAt\"
        FROM \"Users\"
        WHERE \"Username\" LIKE '$K6_MEMBER_PATTERN'
        ORDER BY \"Username\"
        LIMIT 5;
    " 2>/dev/null || log_warn "Không thể preview IdentityDB"
fi

if confirm "Xóa tài khoản K6 (k6member001-020) trong IdentityDB?"; then
    # Xóa refresh tokens của K6 users trước
    delete_pg "$IDENTITY_DB" "RefreshToken" \
        "\"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Username\" LIKE '$K6_MEMBER_PATTERN')" \
        "RefreshToken của K6 accounts"

    # Xóa K6 users
    delete_pg "$IDENTITY_DB" "Users" \
        "\"Username\" LIKE '$K6_MEMBER_PATTERN'" \
        "Users K6 accounts"
fi

# ================================================================
# SECTION 3: PROMOTION SERVICE — BunBoPromotionDb
# ================================================================
log_section "3. PROMOTION SERVICE (BunBoPromotionDb)"

if [[ -n "$PG_POD" ]]; then
    log_info "Preview voucher K6 trong PromotionDB:"
    run_pg_sql_full "$PROMOTION_DB" "
        SELECT \"Code\", \"TotalUsageLimit\", \"UsageCount\", \"IsActive\"
        FROM \"Vouchers\"
        WHERE \"Code\" = '$K6_VOUCHER_CODE';
    " 2>/dev/null || log_warn "Không thể preview PromotionDB"
fi

if confirm "Xóa voucher '$K6_VOUCHER_CODE' và loyalty points K6 trong PromotionDB?"; then
    # Xóa PointTransactions của K6 members trước
    delete_pg "$PROMOTION_DB" "PointTransactions" \
        "\"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Username\" LIKE '$K6_MEMBER_PATTERN')" \
        "PointTransactions của K6 accounts"

    # Xóa UserVouchers của K6 members
    delete_pg "$PROMOTION_DB" "UserVouchers" \
        "\"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Username\" LIKE '$K6_MEMBER_PATTERN')" \
        "UserVouchers của K6 accounts"

    # Xóa UserVouchers liên quan đến K6 voucher (K6_RACE_V1)
    delete_pg "$PROMOTION_DB" "UserVouchers" \
        "\"VoucherId\" IN (SELECT \"Id\" FROM \"Vouchers\" WHERE \"Code\" = '$K6_VOUCHER_CODE')" \
        "UserVouchers của K6_RACE_V1"

    # Xóa K6 race voucher
    delete_pg "$PROMOTION_DB" "Vouchers" \
        "\"Code\" = '$K6_VOUCHER_CODE'" \
        "Voucher K6_RACE_V1"

    # Xóa loyalty points của K6 members
    delete_pg "$PROMOTION_DB" "LoyaltyPoints" \
        "\"UserId\" IN (SELECT \"Id\" FROM \"Users\" WHERE \"Username\" LIKE '$K6_MEMBER_PATTERN')" \
        "LoyaltyPoints của K6 accounts"
fi

# ================================================================
# SECTION 4: REDIS — Cart data của K6 sessions
# ================================================================
log_section "4. REDIS — Cart data của K6 table sessions"

# Cart keys trong Redis theo format "cart:{tableSessionId}"
# Các K6 sessions được tạo qua /orders/tables/{K6-T*}/scan

log_info "Tìm cart keys K6 trong Redis..."
REDIS_POD=$(find_pod "$REDIS_POD_SELECTOR" "$REDIS_NS" 2>/dev/null || echo "")

if [[ -n "$REDIS_POD" ]]; then
    # Lấy danh sách cart keys (pattern: cart:*)
    K6_CART_KEYS=$(kubectl exec -n "$REDIS_NS" "$REDIS_POD" -- \
        redis-cli -a "$REDIS_PASSWORD" --no-auth-warning KEYS "cart:*" 2>/dev/null | wc -l || echo 0)
    log_info "Tổng cart keys hiện tại trong Redis: $K6_CART_KEYS"

    if $DRY_RUN; then
        log_dry "Would flush cart:* keys từ Redis (nếu xác nhận)"
    elif confirm "Xóa tất cả cart data trong Redis? (Cẩn thận: xóa cả cart của khách hàng thật nếu có)"; then
        # Chỉ xóa cart keys — không flush toàn bộ Redis
        CART_COUNT=$(kubectl exec -n "$REDIS_NS" "$REDIS_POD" -- \
            redis-cli -a "$REDIS_PASSWORD" --no-auth-warning KEYS "cart:*" 2>/dev/null | wc -l)
        if [[ "$CART_COUNT" -gt 0 ]]; then
            kubectl exec -n "$REDIS_NS" "$REDIS_POD" -- \
                redis-cli -a "$REDIS_PASSWORD" --no-auth-warning --eval <(echo "
                    local keys = redis.call('KEYS', 'cart:*')
                    local count = 0
                    for _, key in ipairs(keys) do
                        redis.call('DEL', key)
                        count = count + 1
                    end
                    return count
                ") 2>/dev/null || \
            # Fallback: xóa từng key
            kubectl exec -n "$REDIS_NS" "$REDIS_POD" -- \
                redis-cli -a "$REDIS_PASSWORD" --no-auth-warning KEYS "cart:*" 2>/dev/null | \
                xargs -r kubectl exec -n "$REDIS_NS" "$REDIS_POD" -- redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DEL 2>/dev/null
            log_ok "Đã xóa $CART_COUNT cart keys khỏi Redis ✓"
            TOTAL_DELETED=$((TOTAL_DELETED + CART_COUNT))
        else
            log_info "Không có cart keys trong Redis"
        fi
    fi
else
    log_warn "Không tìm thấy Redis pod — bỏ qua Redis cleanup"
    log_info "Manual: kubectl exec -n redis <redis-pod> -- redis-cli KEYS 'cart:*'"
fi

# ================================================================
# SECTION 5: OUTBOX MESSAGES (nếu có)
# ================================================================
log_section "5. OUTBOX MESSAGES — Dọn K6 outbox entries"

# MassTransit Outbox trong OrderService
if [[ -n "$PG_POD" ]] && confirm "Xóa outbox messages của K6 orders?"; then
    # MassTransit OutboxMessage schema dùng "SentTime" (không phải "SentAt")
    delete_pg "$ORDER_DB" "OutboxMessage" \
        "\"MessageType\" LIKE '%OrderCreated%' AND \"SentTime\" IS NOT NULL AND \"EnqueueTime\" > NOW() - INTERVAL '24 hours'" \
        "Outbox messages (24h gần nhất — đã gửi)" 2>/dev/null || \
    log_warn "Table OutboxMessage không tồn tại hoặc tên khác — bỏ qua"

    delete_pg "$ORDER_DB" "OutboxState" \
        "\"Created\" > NOW() - INTERVAL '24 hours'" \
        "OutboxState (24h gần nhất)" 2>/dev/null || \
    log_warn "Table OutboxState không tồn tại — bỏ qua"
fi

# ================================================================
# SUMMARY
# ================================================================
log_section "CLEANUP SUMMARY"

echo ""
if $DRY_RUN; then
    echo -e "${CYAN}  Mode: DRY RUN — Không có dữ liệu nào bị xóa${NC}"
else
    echo -e "${GREEN}  ✅ Tổng rows đã xóa: $TOTAL_DELETED${NC}"
    if [[ "$ERRORS" -gt 0 ]]; then
        echo -e "${RED}  ❌ Lỗi gặp phải: $ERRORS${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}  ── Manual Cleanup Commands (nếu script thất bại) ──${NC}"
echo ""
cat << 'MANUAL'
# Tìm postgres pod:
kubectl get pods -A | grep postgres

# Order DB:
kubectl exec -n postgresql <postgres-pod> -- \
  env PGPASSWORD=bunbopw123! psql -U postgres -d bunbo_order_db -c \
  "DELETE FROM \"OrderItems\" WHERE \"OrderId\" IN (SELECT \"Id\" FROM \"Orders\" WHERE \"Note\" LIKE 'k6-%');
   DELETE FROM \"Orders\" WHERE \"Note\" LIKE 'k6-%';
   DELETE FROM \"TableSessions\" WHERE \"TableId\" IN (SELECT \"Id\" FROM \"RestaurantTables\" WHERE \"TableCode\" LIKE 'K6-T%');
   DELETE FROM \"RestaurantTables\" WHERE \"TableCode\" LIKE 'K6-T%';"

# Identity DB:
kubectl exec -n postgresql <postgres-pod> -- \
  env PGPASSWORD=bunbopw123! psql -U postgres -d "BunBoIdentityDb" -c \
  "DELETE FROM \"AspNetUserRoles\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"AspNetUsers\" WHERE \"UserName\" LIKE 'k6member%');
   DELETE FROM \"AspNetUserClaims\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"AspNetUsers\" WHERE \"UserName\" LIKE 'k6member%');
   DELETE FROM \"RefreshTokens\" WHERE \"UserId\" IN (SELECT \"Id\" FROM \"AspNetUsers\" WHERE \"UserName\" LIKE 'k6member%');
   DELETE FROM \"AspNetUsers\" WHERE \"UserName\" LIKE 'k6member%';"

# Promotion DB:
kubectl exec -n postgresql <postgres-pod> -- \
  env PGPASSWORD=bunbopw123! psql -U postgres -d "BunBoPromotionDb" -c \
  "DELETE FROM \"UserVouchers\" WHERE \"VoucherId\" IN (SELECT \"Id\" FROM \"Vouchers\" WHERE \"Code\" = 'K6_RACE_V1');
   DELETE FROM \"Vouchers\" WHERE \"Code\" = 'K6_RACE_V1';"

# Redis:
kubectl exec -n redis <redis-pod> -- redis-cli KEYS 'cart:*'
kubectl exec -n redis <redis-pod> -- redis-cli --eval /dev/stdin <<'EOF'
local keys = redis.call('KEYS', 'cart:*')
for _, k in ipairs(keys) do redis.call('DEL', k) end
return #keys
EOF
MANUAL

echo ""
echo -e "${GREEN}  Cleanup hoàn thành!${NC}"
echo ""
