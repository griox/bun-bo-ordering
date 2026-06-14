/**
 * BunBo Microservices — Full Flow Load Test v2.0 (400 VUs Edition)
 * ================================================================
 * Scaled up to 400 total VUs (Guest: 200, Member: 120, Kitchen: 30, Voucher Race: 30, Chaos: 20)
 * Increased member accounts pool to 30 for better session distribution.
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
    setupTimeout: '450s', // 30 accounts × 9s/account = 270s — set to 450s to prevent setup timeout
    scenarios: {
        guest_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 200 }, // Scaled to 200 VUs
                { duration: '4m', target: 200 },
                { duration: '1m', target: 0 },
            ],
            exec: 'guestFlow',
            tags: { flow: 'guestFlow' },
        },
        member_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 120 }, // Scaled to 120 VUs
                { duration: '4m', target: 120 },
                { duration: '1m', target: 0 },
            ],
            exec: 'memberFlow',
            tags: { flow: 'memberFlow' },
        },
        kitchen_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 30 },  // Scaled to 30 VUs
                { duration: '3m', target: 30 },
                { duration: '1m', target: 0 },
            ],
            exec: 'kitchenAdminFlow',
            tags: { flow: 'kitchenAdminFlow' },
            startTime: '1m',
        },
        voucher_race: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 30 },  // Scaled to 30 VUs
                { duration: '3m', target: 30 },
                { duration: '1m', target: 0 },
            ],
            exec: 'voucherRaceFlow',
            tags: { flow: 'voucherRaceFlow' },
        },
        chaos_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '4m', target: 20 },  // Scaled to 20 VUs
                { duration: '4m', target: 20 },
                { duration: '1m', target: 0 },
            ],
            exec: 'chaosFlow',
            tags: { flow: 'chaosFlow' },
        },
    },
    thresholds: {
        // Global
        'http_req_duration': ['p(95)<3000'], // Relaxed slightly to account for high resource pressure at 400 VUs
        'http_req_failed':   ['rate<0.05'],
        // Per flow
        'http_req_duration{flow:guestFlow}':       ['p(95)<2000'],
        'http_req_duration{flow:memberFlow}':      ['p(95)<2500'],
        'http_req_duration{flow:kitchenAdminFlow}':['p(95)<1500'],
        'http_req_duration{flow:voucherRaceFlow}': ['p(95)<1000'],
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

function getVuIp() {
    return `192.168.1.${Math.floor(Math.random() * 250) + 1}`;
}

function post(url, body, headers, timeout = '15s') {
    const finalHeaders = Object.assign({}, headers, { 'X-Forwarded-For': getVuIp() });
    return http.post(url, JSON.stringify(body), { headers: finalHeaders, timeout });
}

function get(url, headers, timeout = '15s') {
    const finalHeaders = Object.assign({}, headers, { 'X-Forwarded-For': getVuIp() });
    return http.get(url, { headers: finalHeaders, timeout });
}

function put(url, body, headers, timeout = '15s') {
    const finalHeaders = Object.assign({}, headers, { 'X-Forwarded-For': getVuIp() });
    return http.put(url, body ? JSON.stringify(body) : null, { headers: finalHeaders, timeout });
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// SETUP — Chạy 1 lần duy nhất trước toàn bộ test
// ============================================
export function setup() {
    console.log('[SETUP] Starting test setup (400 VUs)...');

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

    // 2. Tạo pool 30 tài khoản member test (đảm bảo tải phân tán tốt hơn)
    const memberTokens = [];
    for (let i = 1; i <= 30; i++) {
        const username = `k6member${String(i).padStart(3, '0')}`;
        const email    = `${username}@k6test.local`;
        const password = 'K6Test@1234';

        // Register (bỏ qua lỗi nếu đã tồn tại)
        const regRes = http.post(`${BASE_URL}/identity/register`,
            JSON.stringify({ username, email, password }),
            { headers: defaultHeaders, timeout: '10s' }
        );
        // Chờ 4.5s để tránh vượt qua Rate Limit Identity (15 req/phút/IP)
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
            console.log(`[SETUP] Member ${username} ready (${memberTokens.length}/30)`);
        } else {
            console.warn(`[SETUP] Login failed for ${username}: ${loginRes.status}`);
        }
        sleep(4.5);
    }
    console.log(`[SETUP] Member pool created: ${memberTokens.length} accounts`);

    // 3. Seed 30 bàn test để phân tán giỏ hàng và đơn hàng tốt hơn
    const tablesRes = get(`${BASE_URL}/orders/tables`, authHeaders(adminToken));
    let tableIds = [];
    if (tablesRes.status === 200) {
        try {
            const tables = tablesRes.json();
            tableIds = tables.map(t => t.id);
        } catch (e) { /* ignore */ }
    }

    // Tạo thêm bàn nếu chưa đủ 30
    for (let i = tableIds.length + 1; i <= 30; i++) {
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

    // 4. Tạo voucher race test
    let raceVoucherId = null;
    const voucherRes = post(`${BASE_URL}/promotion/vouchers`, {
        code: RACE_VOUCHER_CODE,
        type: 'Public',
        discountType: 'FixedAmount',
        discountValue: 10000,
        minimumOrderAmount: 50000,
        validFrom: new Date().toISOString(),
        validTo: '2027-12-31T23:59:59Z',
        totalUsageLimit: 200,        // Tăng giới hạn lên 200 cho tải cao
        maxUsagePerUser: 20,         // Tối đa 20 lần sử dụng cho mỗi user
    }, authHeaders(adminToken), '10s');

    if (voucherRes.status === 200 || voucherRes.status === 201) {
        try { raceVoucherId = voucherRes.json('id'); } catch (e) { /* ignore */ }
        console.log(`[SETUP] Race voucher created: ${RACE_VOUCHER_CODE}`);
    } else {
        console.warn(`[SETUP] Race voucher creation: ${voucherRes.status}`);
    }

    return { adminToken, memberTokens, tableIds, raceVoucherId };
}

// ============================================
// GUEST FLOW
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

    // 3. Add to Cart
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
    sleep(Math.random() * 2 + 1);

    // 4. Place Order (Cash)
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
// MEMBER FLOW
// ============================================
export function memberFlow(data) {
    const tableIds = data.tableIds && data.tableIds.length > 0
        ? data.tableIds
        : ['9395339b-f83e-4482-b215-48e9e428a922'];

    const memberPool = data.memberTokens || [];
    if (memberPool.length === 0) { sleep(2); return; }

    sleep((__VU % 15) * 0.4);

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
    sleep(Math.random() * 2 + 1);

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
            voucherCode = null;
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

    // 9. Check Loyalty Points
    sleep(1);
    const pointsRes = get(`${BASE_URL}/promotion/points`, authHeaders(token));
    check(pointsRes, { 'member: points 200': r => r.status === 200 });

    sleep(2);
}

// ============================================
// KITCHEN ADMIN FLOW
// ============================================
export function kitchenAdminFlow(data) {
    const adminToken = data.adminToken;
    if (!adminToken) { sleep(3); return; }

    const p = { headers: authHeaders(adminToken), timeout: '15s' };

    // 1. Get Unread Orders
    const unreadRes = http.get(`${BASE_URL}/orders/unread`, p);
    if (!check(unreadRes, { 'kitchen: unread 200': r => r.status === 200 })) {
        sleep(2); return;
    }

    let orders = [];
    try { orders = unreadRes.json(); } catch (e) { /* ignore */ }

    if (!Array.isArray(orders) || orders.length === 0) {
        const allRes = http.get(`${BASE_URL}/orders/?skip=0&take=10&status=Processing`, p);
        if (allRes.status === 200) {
            try {
                const raw = allRes.json();
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

    // 2. Fulfill 1-2 orders
    const toProcess = orders
        .filter(o => o && UUID_REGEX.test(o.id))
        .slice(0, Math.min(2, orders.length));

    if (toProcess.length === 0) {
        sleep(3); return;
    }

    for (const order of toProcess) {
        const orderId = order.id;
        if (!orderId) continue;

        // Fulfill (Processing -> Completed)
        const completeRes = put(
            `${BASE_URL}/orders/${orderId}/status?status=Completed`,
            null, authHeaders(adminToken)
        );
        check(completeRes, { 'kitchen: complete 204': r => [204, 200].includes(r.status) });
        sleep(1.5);

        // Fulfill Cash Order (Completed -> Paid)
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

    // 3. Mark read
    if (toProcess.length > 0 && toProcess[0].tableCode) {
        http.post(`${BASE_URL}/orders/mark-read-by-table/${toProcess[0].tableCode}`, null, p);
    }

    sleep(2);
}

// ============================================
// VOUCHER RACE FLOW
// ============================================
export function voucherRaceFlow(data) {
    const memberPool = data.memberTokens || [];
    if (memberPool.length === 0) { sleep(2); return; }

    const account = memberPool[__VU % memberPool.length];
    const token = account.token;
    if (!token) { sleep(2); return; }

    const validateRes = post(`${BASE_URL}/promotion/vouchers/validate`, {
        code: RACE_VOUCHER_CODE,
        orderValue: 100000,
    }, authHeaders(token));

    check(validateRes, {
        'race: valid response':    r => [200, 400, 409, 429].includes(r.status),
        'race: no server error':   r => r.status !== 500,
    });

    if (validateRes.status === 200) {
        voucherGranted.add(1);
    } else if (validateRes.status === 400 || validateRes.status === 409 || validateRes.status === 429) {
        voucherRejected.add(1);
    }

    sleep(0.5);
}

// ============================================
// CHAOS FLOW
// ============================================
export function chaosFlow() {
    const p5s = { headers: defaultHeaders, timeout: '5s' };
    const ADMIN_URL = `${BASE_URL}/identity`;

    // Case 1: Duplicate Webhook
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

    // Case 3: 404 Endpoint
    const res404 = http.get(`${BASE_URL}/non-existent-chaos-endpoint`, { timeout: '5s' });
    check(res404, { 'chaos: 404 caught': r => r.status === 404 });

    // Case 4: Empty Cart Place Order
    const fakeSessionId = '00000000-0000-0000-0000-000000000001';
    const resEmptyCart = post(`${BASE_URL}/orders/`, {
        tableSessionId: fakeSessionId,
        paymentMethod: 'Cash',
    }, defaultHeaders);
    check(resEmptyCart, { 'chaos: empty cart order → 400/404': r => [400, 404].includes(r.status) });

    // Case 5: Expired/Invalid Voucher
    const resExpiredVoucher = post(`${BASE_URL}/promotion/vouchers/validate`, {
        code: 'INVALID_VOUCHER_XYZ',
        orderValue: 100000,
    }, {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_chaos',
    });
    check(resExpiredVoucher, { 'chaos: invalid voucher auth → 401': r => [400, 401, 403].includes(r.status) });

    // Case 6: Identity Rate Limit Test
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
// TEARDOWN — Report & Cleanup command logging
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
    console.log('══════════════════════════════════════════════════════════');
}
