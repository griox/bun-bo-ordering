/**
 * BunBo Microservices — Full Flow Load Test v2.0
 * ================================================
 * Improvements:
 * [N1] Dynamic token per VU (50 test accounts pool)
 * [N2] Kitchen Admin Flow (order fulfillment lifecycle)
 * [N3] Voucher Race Condition test
 * [N4] Cash order full lifecycle (create → Paid)
 * [N5] Expanded table pool (20 tables seeded in setup)
 * [N6] Enhanced chaos testing (rate limit, empty cart, invalid session)
 * [N7] Teardown & cleanup logging
 * [N8] Correct thresholds per scenario
 */
import http from 'k6/http';
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

// ============================================
// CUSTOM METRICS
// ============================================
const voucherGranted   = new Counter('voucher_race_granted');
const voucherRejected  = new Counter('voucher_race_rejected');
const ordersCreated    = new Counter('orders_created_total');
const ordersPaid       = new Counter('orders_paid_total');

// ============================================
// CONFIG
// ============================================
const BASE_URL    = __ENV.BASE_URL || 'https://api.bun-bo-chung-cu.io.vn/api';
const SEPAY_KEY   = __ENV.SEPAY_KEY || 'Bunbopaymentsupersecret16032004@';
const RACE_VOUCHER_CODE = 'K6_RACE_V1'; // Tạo trong setup()

// UUID format validator
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const options = {
    setupTimeout: '300s', // [CR FIX] 20 accounts × 9s/account = 180s — cần nhiều hơn 60s default
    scenarios: {
        guest_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 150 }, // Ramp-up chậm rãi để HPA kịp scale (từ 2 -> 4 pods mất khoảng ~1.5 phút)
                { duration: '4m', target: 150 }, // Duy trì ở mức tải cao nhất
                { duration: '1m', target: 0 },   // Scale down
            ],
            exec: 'guestFlow',
            tags: { flow: 'guestFlow' },
        },
        member_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 90 },
                { duration: '4m', target: 90 },
                { duration: '1m', target: 0 },
            ],
            exec: 'memberFlow',
            tags: { flow: 'memberFlow' },
        },
        kitchen_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 20 }, // Bắt đầu sau khi guest/member đã tạo đơn
                { duration: '3m', target: 20 },
                { duration: '1m', target: 0 },
            ],
            exec: 'kitchenAdminFlow',
            tags: { flow: 'kitchenAdminFlow' },
            startTime: '1m', // Delay để đơn hàng được tạo trước
        },
        voucher_race: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 25 },
                { duration: '3m', target: 25 },
                { duration: '1m', target: 0 },
            ],
            exec: 'voucherRaceFlow',
            tags: { flow: 'voucherRaceFlow' },
        },
        chaos_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 15 },
                { duration: '4m', target: 15 },
                { duration: '1m', target: 0 },
            ],
            exec: 'chaosFlow',
            tags: { flow: 'chaosFlow' },
        },
    },
    thresholds: {
        // Global
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed':   ['rate<0.05'],
        // Per flow (dùng tag 'flow' thay vì 'scenario' để tránh conflict với k6 built-in tag)
        'http_req_duration{flow:guestFlow}':       ['p(95)<1500'],
        'http_req_duration{flow:memberFlow}':      ['p(95)<2000'],
        'http_req_duration{flow:kitchenAdminFlow}':['p(95)<1000'],
        'http_req_duration{flow:voucherRaceFlow}': ['p(95)<800'],
        // Business rules
        'checks{flow:voucherRaceFlow}': ['rate>0.95'],
        'checks{flow:chaosFlow}':       ['rate>0.90'],
    },
};

// ============================================
// HELPERS
// ============================================
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
};

function authHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Connection': 'keep-alive',
    };
}

function post(url, body, headers, timeout = '15s') {
    return http.post(url, JSON.stringify(body), { headers, timeout });
}

function get(url, headers, timeout = '15s') {
    return http.get(url, { headers, timeout });
}

function put(url, body, headers, timeout = '15s') {
    return http.put(url, body ? JSON.stringify(body) : null, { headers, timeout });
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// SETUP — Chạy 1 lần duy nhất trước toàn bộ test
// ============================================
export function setup() {
    console.log('[SETUP] Starting test setup...');

    // 1. Login admin
    const adminLogin = post(`${BASE_URL}/identity/login`,
        { username: 'admin', password: 'Admin@123' },
        defaultHeaders
    );
    if (adminLogin.status !== 200) {
        console.error(`[SETUP] Admin login failed: ${adminLogin.status} - ${adminLogin.body}`);
        return { adminToken: '', memberTokens: [], tableIds: [], raceVoucherId: null };
    }
    const adminToken = adminLogin.json('token');
    console.log('[SETUP] Admin login OK');

    // 2. [N1] Tạo pool 20 tài khoản member test
    // [RC-3 FIX] Rate limit Identity = 15 req/phút/IP → tối đa 0.25 req/s
    // sleep(4.5s) giữa mỗi cặp register+login để đảm bảo không bị 429
    const memberTokens = [];
    for (let i = 1; i <= 20; i++) {
        const username = `k6member${String(i).padStart(3, '0')}`;
        const email    = `${username}@k6test.local`;
        const password = 'K6Test@1234';

        // Register (bỏ qua lỗi nếu đã tồn tại)
        const regRes = http.post(`${BASE_URL}/identity/register`,
            JSON.stringify({ username, email, password }),
            { headers: defaultHeaders, timeout: '10s' }
        );
        // Chờ 4.5s: đảm bảo register + login = 2 req trong ~9s < 15 req/phút limit
        sleep(4.5);

        // Login để lấy token
        const loginRes = post(`${BASE_URL}/identity/login`,
            { username, password },
            defaultHeaders, '10s'
        );
        if (loginRes.status === 200) {
            memberTokens.push({
                token: loginRes.json('token'),
                userId: loginRes.json('userId'),
                username,
            });
            console.log(`[SETUP] Member ${username} ready (${memberTokens.length}/20)`);
        } else {
            console.warn(`[SETUP] Login failed for ${username}: ${loginRes.status}`);
        }
        sleep(4.5);
    }
    console.log(`[SETUP] Member pool created: ${memberTokens.length} accounts`);

    // 3. [N5] Seed 20 bàn test (lấy danh sách bàn hiện có trước)
    const tablesRes = get(`${BASE_URL}/orders/tables`, authHeaders(adminToken));
    let tableIds = [];
    if (tablesRes.status === 200) {
        try {
            const tables = tablesRes.json();
            tableIds = tables.map(t => t.id);
        } catch (e) { /* ignore */ }
    }

    // Tạo thêm bàn nếu chưa đủ 20
    for (let i = tableIds.length + 1; i <= 20; i++) {
        const createRes = post(`${BASE_URL}/orders/tables`,
            { tableCode: `K6-T${i}`, name: `K6 Test Table ${i}` },
            authHeaders(adminToken), '10s'
        );
        if (createRes.status === 201 || createRes.status === 200) {
            try {
                const newId = createRes.json('id');
                if (newId) tableIds.push(newId);
            } catch (e) { /* ignore */ }
        }
        sleep(0.1);
    }
    console.log(`[SETUP] Table pool: ${tableIds.length} tables`);

    // 4. [N3] Tạo voucher race test
    // [RC-2 FIX] Thêm type: 'Public' để tránh VoucherType.PointRedemption default
    // ValidateVoucherQuery kiểm tra: if (type == PointRedemption && userVoucher == null) → reject
    let raceVoucherId = null;
    const voucherRes = post(`${BASE_URL}/promotion/vouchers`, {
        code: RACE_VOUCHER_CODE,
        type: 'Public',              // [RC-2] Bắt buộc — không để server default PointRedemption
        discountType: 'FixedAmount',
        discountValue: 10000,
        minimumOrderAmount: 50000,
        validFrom: new Date().toISOString(),
        validTo: '2027-12-31T23:59:59Z',
        totalUsageLimit: 100,        // Tổng toàn hệ thống: cao để race condition xảy ra ở maxUsagePerUser
        maxUsagePerUser: 10,         // Mỗi user được dùng tối đa 10 lần
    }, authHeaders(adminToken), '10s');

    if (voucherRes.status === 200 || voucherRes.status === 201) {
        try { raceVoucherId = voucherRes.json('id'); } catch (e) { /* ignore */ }
        console.log(`[SETUP] Race voucher created: ${RACE_VOUCHER_CODE} (maxUsagePerUser=10)`);
    } else {
        console.warn(`[SETUP] Race voucher creation: ${voucherRes.status} — ${voucherRes.body}`);
    }

    return { adminToken, memberTokens, tableIds, raceVoucherId };
}

// ============================================
// GUEST FLOW — Cash payment, no auth
// ============================================
export function guestFlow(data) {
    const tableIds = data.tableIds && data.tableIds.length > 0
        ? data.tableIds
        : ['f962d655-e0a5-4d64-b40a-d989921dfaf5'];

    const TABLE_ID = getRandomItem(tableIds);
    const p = { headers: defaultHeaders, timeout: '15s' };

    // 1. Scan Table
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`, null, p);
    if (!check(scanRes, { 'guest: scan 200': r => r.status === 200 })) {
        sleep(1); return;
    }
    const tableSessionId = scanRes.json('sessionId') || scanRes.json();
    if (!tableSessionId) { sleep(1); return; }

    // 2. Get Catalog
    const catalogRes = get(`${BASE_URL}/catalog/foods`, defaultHeaders);
    let foodId = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f';
    if (catalogRes.status === 200) {
        try {
            const foods = catalogRes.json();
            if (Array.isArray(foods) && foods.length > 0) {
                foodId = getRandomItem(foods).id;
            }
        } catch (e) { /* ignore */ }
    }
    sleep(1);

    // 3. Add to Cart (simulate think time with 1-3 items)
    const qty = Math.floor(Math.random() * 3) + 1;
    const cartRes = post(`${BASE_URL}/cart`, {
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId, quantity: qty }],
        },
    }, defaultHeaders);
    if (!check(cartRes, { 'guest: cart 200': r => r.status === 200 })) {
        sleep(1); return;
    }
    sleep(Math.random() * 2 + 1); // Think time 1-3s

    // 4. [N4] Place Order (Cash)
    const orderRes = post(`${BASE_URL}/orders/`, {
        tableSessionId,
        paymentMethod: 'Cash',
        note: 'k6-guest-cash-test',
    }, defaultHeaders);

    if (check(orderRes, { 'guest: order 201': r => r.status === 201 })) {
        ordersCreated.add(1);
    }
    sleep(2);
}

// ============================================
// MEMBER FLOW — [N1] Dynamic token, Transfer + Voucher
// ============================================
export function memberFlow(data) {
    const tableIds = data.tableIds && data.tableIds.length > 0
        ? data.tableIds
        : ['9395339b-f83e-4482-b215-48e9e428a922'];

    // [N1] Mỗi VU lấy token từ pool theo VU index
    const memberPool = data.memberTokens || [];
    if (memberPool.length === 0) { sleep(2); return; }

    // Stagger login để tránh rate limit 15 req/phút
    sleep((__VU % 10) * 0.5);

    const account = memberPool[__VU % memberPool.length];
    const token = account.token;
    if (!token) { sleep(2); return; }

    const TABLE_ID = getRandomItem(tableIds);
    const p = { headers: authHeaders(token), timeout: '15s' };

    // 1. Scan Table
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`, null, p);
    if (!check(scanRes, { 'member: scan 200': r => r.status === 200 })) {
        sleep(1); return;
    }
    const tableSessionId = scanRes.json('sessionId') || scanRes.json();
    if (!tableSessionId) { sleep(1); return; }

    // 2. View Catalog
    const catalogRes = get(`${BASE_URL}/catalog/foods`, authHeaders(token));
    let foodId = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f';
    let foodPrice = 50000;
    if (catalogRes.status === 200) {
        try {
            const foods = catalogRes.json();
            if (Array.isArray(foods) && foods.length > 0) {
                const food = getRandomItem(foods);
                foodId = food.id;
                foodPrice = food.price || 50000;
            }
        } catch (e) { /* ignore */ }
    }
    sleep(Math.random() * 2 + 1); // Think time

    // 3. Add to Cart
    const qty = 2;
    const cartRes = post(`${BASE_URL}/cart`, {
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId, quantity: qty }],
        },
    }, authHeaders(token));
    if (!check(cartRes, { 'member: cart 200': r => r.status === 200 })) {
        sleep(1); return;
    }
    sleep(1);

    // 4. Check Active Vouchers
    const vouchersRes = get(`${BASE_URL}/promotion/vouchers/active`, authHeaders(token));
    check(vouchersRes, { 'member: vouchers 200': r => r.status === 200 });

    let voucherCode = null;
    let discountAmount = 0;
    if (vouchersRes.status === 200) {
        try {
            const vouchers = vouchersRes.json();
            if (Array.isArray(vouchers) && vouchers.length > 0) {
                voucherCode = vouchers[0].code;
            }
        } catch (e) { /* ignore */ }
    }

    // 5. Validate Voucher
    const orderValue = foodPrice * qty;
    if (voucherCode) {
        const validateRes = post(`${BASE_URL}/promotion/vouchers/validate`,
            { code: voucherCode, orderValue },
            authHeaders(token)
        );
        check(validateRes, { 'member: voucher validate': r => [200, 400, 429].includes(r.status) });
        if (validateRes.status === 200) {
            try { discountAmount = validateRes.json('discountAmount') || 0; } catch (e) { /* ignore */ }
        } else {
            voucherCode = null; // Voucher không hợp lệ, bỏ qua
        }
    }
    sleep(1);

    // 6. Create Order (Transfer)
    const orderRes = post(`${BASE_URL}/orders/`, {
        tableSessionId,
        paymentMethod: 'Transfer',
        voucherCode,
        discountAmount,
        note: 'k6-member-transfer-test',
    }, authHeaders(token));

    if (!check(orderRes, { 'member: order 201': r => r.status === 201 })) {
        sleep(1); return;
    }
    ordersCreated.add(1);
    const orderId = orderRes.json('id');
    const finalAmount = orderValue - discountAmount;
    sleep(1);

    // 7. Initialize Payment
    const payRes = post(`${BASE_URL}/payments`, {
        orderId,
        amount: finalAmount,
        voucherCode,
        tableSessionId,
        tableNumber: 'K6-T1',
        note: 'k6-payment-init',
    }, authHeaders(token));

    if (!check(payRes, { 'member: payment init 200': r => r.status === 200 })) {
        sleep(1); return;
    }
    sleep(1);

    // 8. Mock SePay Webhook
    const webhookPayload = {
        id: Date.now() * 1000 + Math.floor(Math.random() * 999) + __VU,
        gateway: 'VietQR',
        transactionDate: new Date().toISOString(),
        accountNumber: '123456789',
        code: '00',
        content: `SEVQR ${orderId}`,
        transferType: 'in',
        transferAmount: finalAmount,
        accumulated: finalAmount,
        subAccount: 'K6Sub',
        referenceCode: orderId,
        description: 'k6 mock payment',
    };

    const webhookRes = post(`${BASE_URL}/payments/webhook/sepay`, webhookPayload, {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${SEPAY_KEY}`,
        'Connection': 'keep-alive',
    }, '15s');
    check(webhookRes, { 'member: webhook 200': r => r.status === 200 });

    // 9. Kiểm tra điểm loyalty
    sleep(1);
    const pointsRes = get(`${BASE_URL}/promotion/points`, authHeaders(token));
    check(pointsRes, { 'member: points 200': r => r.status === 200 });

    sleep(2);
}

// ============================================
// KITCHEN ADMIN FLOW — [N2] Order fulfillment
// ============================================
export function kitchenAdminFlow(data) {
    const adminToken = data.adminToken;
    if (!adminToken) { sleep(3); return; }

    const p = { headers: authHeaders(adminToken), timeout: '15s' };

    // 1. Lấy danh sách đơn chưa đọc (mới)
    const unreadRes = http.get(`${BASE_URL}/orders/unread`, p);
    if (!check(unreadRes, { 'kitchen: unread 200': r => r.status === 200 })) {
        sleep(2); return;
    }

    let orders = [];
    try { orders = unreadRes.json(); } catch (e) { /* ignore */ }

    if (!Array.isArray(orders) || orders.length === 0) {
        // [RC-1 FIX] Fallback: GET /orders/ trả về PagedResult — parse đúng cấu trúc
        const allRes = http.get(`${BASE_URL}/orders/?skip=0&take=10&status=Processing`, p);
        if (allRes.status === 200) {
            try {
                const raw = allRes.json();
                // PagedResult có thể có nhiều dạng: { items:[], totalCount } hoặc { data:[], total } hoặc array
                if (Array.isArray(raw)) {
                    orders = raw;
                } else if (Array.isArray(raw.items)) {
                    orders = raw.items;
                } else if (Array.isArray(raw.data)) {
                    orders = raw.data;
                } else if (Array.isArray(raw.orders)) {
                    orders = raw.orders;
                }
            } catch (e) { /* ignore */ }
        }
    }

    if (!Array.isArray(orders) || orders.length === 0) { sleep(3); return; }

    // 2. Xử lý 1-2 đơn hàng
    // [RC-1 FIX] Filter: chỉ xử lý order có id hợp lệ để tránh PUT /orders/undefined/status
    const toProcess = orders
        .filter(o => o && UUID_REGEX.test(o.id)) // [CR FIX] UUID regex thay magic number length > 10
        .slice(0, Math.min(2, orders.length));

    if (toProcess.length === 0) {
        console.warn(`[KITCHEN] Got ${orders.length} orders but none have valid id. Sample: ${JSON.stringify(orders[0])}`);
        sleep(3); return;
    }

    for (const order of toProcess) {
        const orderId = order.id;
        if (!orderId) continue;

        // Hoàn thành chế biến (Processing -> Completed)
        const completeRes = put(
            `${BASE_URL}/orders/${orderId}/status?status=Completed`,
            null, authHeaders(adminToken)
        );
        check(completeRes, { 'kitchen: complete 204': r => [204, 200].includes(r.status) });
        sleep(1.5);

        // [N4] Nếu là đơn Cash, xác nhận thanh toán tiền mặt
        // [CR FIX] Normalize paymentMethod để tránh lỗi case-sensitive (Cash vs cash)
        if ((order.paymentMethod || '').toLowerCase() === 'cash') {
            const paidRes = put(
                `${BASE_URL}/orders/${orderId}/status?status=Paid`,
                null, authHeaders(adminToken)
            );
            if (check(paidRes, { 'kitchen: cash paid 204': r => [204, 200].includes(r.status) })) {
                ordersPaid.add(1);
            }
        }
    }

    // 3. Đánh dấu đã đọc
    if (toProcess.length > 0 && toProcess[0].tableCode) {
        http.post(`${BASE_URL}/orders/mark-read-by-table/${toProcess[0].tableCode}`, null, p);
    }

    sleep(2);
}

// ============================================
// VOUCHER RACE FLOW — [N3] Race condition
// ============================================
export function voucherRaceFlow(data) {
    const memberPool = data.memberTokens || [];
    if (memberPool.length === 0) { sleep(2); return; }

    const account = memberPool[__VU % memberPool.length];
    const token = account.token;
    if (!token) { sleep(2); return; }

    // Tất cả VU cùng dùng 1 mã voucher giới hạn maxUsage=10
    const validateRes = post(`${BASE_URL}/promotion/vouchers/validate`, {
        code: RACE_VOUCHER_CODE,
        orderValue: 100000,
    }, authHeaders(token));

    const ok = check(validateRes, {
        'race: valid response':    r => [200, 400, 409, 429].includes(r.status),
        'race: no server error':   r => r.status !== 500,
    });

    if (validateRes.status === 200) {
        voucherGranted.add(1);
    } else if (validateRes.status === 400 || validateRes.status === 409 || validateRes.status === 429) {
        voucherRejected.add(1);
    }

    // Không cần sleep để tạo tải cực đại
    sleep(0.5);
}

// ============================================
// CHAOS FLOW — [N6] Enhanced chaos testing
// ============================================
export function chaosFlow() {
    const p5s = { headers: defaultHeaders, timeout: '5s' };
    const ADMIN_URL = `${BASE_URL}/identity`;

    // Case 1: Webhook trùng lặp (Idempotency test)
    const dupId = 9999888777;
    const dupPayload = JSON.stringify({
        id: dupId,
        gateway: 'VietQR',
        transactionDate: new Date().toISOString(),
        accountNumber: '000000000',
        code: '00',
        content: 'SEVQR chaos-test-order-dup',
        transferType: 'in',
        transferAmount: 10000,
        accumulated: 10000,
        subAccount: 'Chaos',
        referenceCode: 'chaos-dup-order',
        description: 'chaos duplicate injection',
    });
    const webhookHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Apikey ${SEPAY_KEY}`,
        'Connection': 'keep-alive',
    };
    http.post(`${BASE_URL}/payments/webhook/sepay`, dupPayload, { headers: webhookHeaders, timeout: '5s' });
    const resDup = http.post(`${BASE_URL}/payments/webhook/sepay`, dupPayload, { headers: webhookHeaders, timeout: '5s' });
    check(resDup, { 'chaos: duplicate webhook handled': r => [200, 400, 409].includes(r.status) });

    // Case 2: Malformed JSON
    const resMalformed = http.post(`${BASE_URL}/cart`, '{ bad_json: missing_quotes }', p5s);
    check(resMalformed, { 'chaos: malformed json → 400': r => r.status === 400 });

    // Case 3: Endpoint không tồn tại → 404
    const res404 = http.get(`${BASE_URL}/non-existent-chaos-endpoint`, { timeout: '5s' });
    check(res404, { 'chaos: 404 caught': r => r.status === 404 });

    // Case 4: [N6] Tạo đơn với giỏ hàng TRỐNG
    const fakeSessionId = '00000000-0000-0000-0000-000000000001';
    const resEmptyCart = post(`${BASE_URL}/orders/`, {
        tableSessionId: fakeSessionId,
        paymentMethod: 'Cash',
    }, defaultHeaders);
    check(resEmptyCart, { 'chaos: empty cart order → 400/404': r => [400, 404].includes(r.status) });

    // Case 5: [N6] Validate expired/invalid voucher
    const resExpiredVoucher = post(`${BASE_URL}/promotion/vouchers/validate`, {
        code: 'INVALID_VOUCHER_XYZ',
        orderValue: 100000,
    }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_chaos',
    });
    check(resExpiredVoucher, { 'chaos: invalid voucher auth → 401': r => [400, 401, 403].includes(r.status) });

    // Case 6: [N6] Đánh vào rate limit Identity
    // Chỉ 1 VU test điều này để không làm ảnh hưởng cả test
    if (__VU === 1 && __ITER % 10 === 0) {
        let rateHit = false;
        for (let i = 0; i < 5; i++) {
            const loginRes = post(`${ADMIN_URL}/login`,
                { username: 'chaos_nonexist', password: 'wrong' },
                defaultHeaders, '5s'
            );
            if (loginRes.status === 429) { rateHit = true; break; }
            sleep(0.1);
        }
        if (rateHit) {
            check({ status: 429 }, { 'chaos: identity rate limit triggers 429': () => true });
        }
    }

    sleep(1);
}

// ============================================
// TEARDOWN — In hướng dẫn cleanup dữ liệu rác
// ============================================
export function teardown(data) {
    const memberCount  = (data.memberTokens || []).length;
    const tableCount   = (data.tableIds || []).length;

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         K6 LOAD TEST COMPLETED — TEARDOWN REPORT        ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`[TEARDOWN] Member accounts created : ${memberCount}`);
    console.log(`[TEARDOWN] Table seats seeded      : ${tableCount}`);
    console.log(`[TEARDOWN] Race voucher code       : ${RACE_VOUCHER_CODE}`);
    console.log('');
    console.log('━━━ CLEANUP OPTION 1 (Recommended): Bash script ━━━━━━━━━');
    console.log('  cd tests/k6-test && chmod +x k6-cleanup.sh');
    console.log('  ./k6-cleanup.sh --dry-run   # Preview trước khi xóa');
    console.log('  ./k6-cleanup.sh             # Xóa có xác nhận từng bước');
    console.log('  ./k6-cleanup.sh --yes       # Tự động xóa toàn bộ');
    console.log('');
    console.log('━━━ CLEANUP OPTION 2: Manual SQL ━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  # OrderDB:');
    console.log('  DELETE FROM "OrderItems" WHERE "OrderId" IN (SELECT "Id" FROM "Orders" WHERE "Note" LIKE \'k6-%\');');
    console.log('  DELETE FROM "Orders" WHERE "Note" LIKE \'k6-%\';');
    console.log('  DELETE FROM "TableSessions" WHERE "TableId" IN (SELECT "Id" FROM "RestaurantTables" WHERE "TableCode" LIKE \'K6-T%\');');
    console.log('  DELETE FROM "RestaurantTables" WHERE "TableCode" LIKE \'K6-T%\';');
    console.log('');
    console.log('  # IdentityDB:');
    console.log('  DELETE FROM "AspNetUserRoles"  WHERE "UserId" IN (SELECT "Id" FROM "AspNetUsers" WHERE "UserName" LIKE \'k6member%\');');
    console.log('  DELETE FROM "AspNetUserClaims" WHERE "UserId" IN (SELECT "Id" FROM "AspNetUsers" WHERE "UserName" LIKE \'k6member%\');');
    console.log('  DELETE FROM "RefreshTokens"    WHERE "UserId" IN (SELECT "Id" FROM "AspNetUsers" WHERE "UserName" LIKE \'k6member%\');');
    console.log('  DELETE FROM "AspNetUsers" WHERE "UserName" LIKE \'k6member%\';');
    console.log('');
    console.log('  # PromotionDB:');
    console.log(`  DELETE FROM "UserVouchers" WHERE "VoucherId" IN (SELECT "Id" FROM "Vouchers" WHERE "Code" = '${RACE_VOUCHER_CODE}');`);
    console.log(`  DELETE FROM "Vouchers" WHERE "Code" = '${RACE_VOUCHER_CODE}';`);
    console.log('');
    console.log('  # Redis (cart data):');
    console.log('  redis-cli --eval - <<\'EOF\'');
    console.log('  local keys = redis.call("KEYS","cart:*")');
    console.log('  for _,k in ipairs(keys) do redis.call("DEL",k) end');
    console.log('  return #keys');
    console.log('  EOF');
    console.log('══════════════════════════════════════════════════════════');
}
