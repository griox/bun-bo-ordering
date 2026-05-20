import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    scenarios: {
        guest_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 195 }, // 65% của 300 VUs
                { duration: '5m', target: 195 },
                { duration: '1m', target: 0 },
            ],
            exec: 'guestFlow',
        },
        member_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 90 }, // 30% của 300 VUs
                { duration: '5m', target: 90 },
                { duration: '1m', target: 0 },
            ],
            exec: 'memberFlow',
        },
        chaos_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 15 }, // 5% của 300 VUs mô phỏng Chaos Testing
                { duration: '5m', target: 15 },
                { duration: '1m', target: 0 },
            ],
            exec: 'chaosFlow',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'], // Expect 95% of requests to complete within 2s
        http_req_failed: ['rate<0.05'],    // Less than 5% failure rate
    },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.bun-bo-chung-cu.io.vn/api';
const SEPAY_API_KEY = 'Bunbopaymentsupersecret16032004@'; // Lấy từ bunbo-secrets

// Danh sách bàn ngẫu nhiên
const TABLE_IDS = [
    'f962d655-e0a5-4d64-b40a-d989921dfaf5',
    '9395339b-f83e-4482-b215-48e9e428a922',
    'dfdab3f3-163d-4535-9f07-321da5991b57',
    'cf39f952-53c0-4a6b-ac25-8e64cb816612'
];

function getRandomTableId() {
    return TABLE_IDS[Math.floor(Math.random() * TABLE_IDS.length)];
}

// Cấu hình Header và Timeout dùng chung tối ưu cho Production
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive'
};

const guestParams = {
    headers: defaultHeaders,
    timeout: '15s' // Ngắt sớm nếu kết nối bị nghẽn ở Tường lửa/Cloudflare, tránh treo 7m30s
};

export function setup() {
    const loginPayload = JSON.stringify({
        username: 'admin',
        password: 'Admin@123'
    });
    
    const loginRes = http.post(`${BASE_URL}/identity/login`, loginPayload, {
        headers: defaultHeaders,
        timeout: '15s'
    });
    
    let token = '';
    if (loginRes.status === 200) {
        token = loginRes.json('token');
        console.log("Setup Login Success: Retrieved JWT Token.");
    } else {
        console.warn(`Setup Login Failed: ${loginRes.status} - ${loginRes.body}`);
    }
    
    return { token: token };
}

// ============================================
// GUEST FLOW (No Authentication, Cash Payment)
// ============================================
export function guestFlow() {
    const TABLE_ID = getRandomTableId();

    // 1. Scan Table
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`, null, { 
        headers: { 'Connection': 'keep-alive' }, 
        timeout: '15s' 
    });
    if (!check(scanRes, { 'guest table scanned 200': (r) => r.status === 200 })) {
        sleep(1); return;
    }
    const tableSessionId = scanRes.json('sessionId');

    // 2. View Catalog
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`, { 
        headers: { 'Connection': 'keep-alive' }, 
        timeout: '15s' 
    });
    let foodId = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f';
    if (catalogRes.status === 200) {
        try {
            const foods = catalogRes.json();
            if (foods && foods.length > 0) {
                const selectedFood = foods[Math.floor(Math.random() * foods.length)];
                foodId = selectedFood.id;
            }
        } catch (e) { /* ignore */ }
    }
    sleep(1);

    // 3. Add to Cart
    const qty = Math.floor(Math.random() * 3) + 1;
    const cartPayload = JSON.stringify({
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId: foodId, quantity: qty }]
        }
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, guestParams);
    if (!check(cartRes, { 'guest cart 200': (r) => r.status === 200 })) { sleep(1); return; }
    sleep(1);

    // 4. Place Order (Cash)
    const orderPayload = JSON.stringify({
        tableSessionId: tableSessionId,
        paymentMethod: 'Cash',
        note: 'Guest Checkout Load Test'
    });
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, guestParams);
    check(orderRes, { 'guest order 201': (r) => r.status === 201 });
    sleep(2);
}

// ============================================
// MEMBER FLOW (JWT Auth, Voucher, Transfer + Webhook)
// ============================================
export function memberFlow(data) {
    const TABLE_ID = getRandomTableId();
    const token = data.token;
    
    if (!token) {
        sleep(2);
        return;
    }

    const memberParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Connection': 'keep-alive'
        },
        timeout: '15s'
    };

    // 1. Scan Table
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`, null, memberParams);
    if (!check(scanRes, { 'member table scanned 200': (r) => r.status === 200 })) {
        sleep(1); return;
    }
    const tableSessionId = scanRes.json('sessionId');

    // 2. View Catalog
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`, memberParams);
    let foodId = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f';
    let foodPrice = 50000;
    if (catalogRes.status === 200) {
        try {
            const foods = catalogRes.json();
            if (foods && foods.length > 0) {
                const selectedFood = foods[Math.floor(Math.random() * foods.length)];
                foodId = selectedFood.id;
                foodPrice = selectedFood.price;
            }
        } catch (e) {}
    }
    sleep(1);

    // 3. Add to Cart
    const qty = 2; // Cố định mua 2 món
    const cartPayload = JSON.stringify({
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId: foodId, quantity: qty }]
        }
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, memberParams);
    if (!check(cartRes, { 'member cart 200': (r) => r.status === 200 })) { sleep(1); return; }
    sleep(1);

    // 4. Check active vouchers
    const activeVouchersRes = http.get(`${BASE_URL}/promotion/vouchers/active`, memberParams);
    check(activeVouchersRes, { 'member active vouchers 200': (r) => r.status === 200 });
    
    let voucherCode = null;
    if (activeVouchersRes.status === 200) {
        try {
            const vouchers = activeVouchersRes.json();
            if (vouchers && vouchers.length > 0) {
                voucherCode = vouchers[0].code;
            }
        } catch(e) {}
    }

    // 5. Validate Voucher
    const orderTotal = foodPrice * qty;
    if (voucherCode) {
        const validatePayload = JSON.stringify({
            code: voucherCode,
            orderValue: orderTotal
        });
        const valRes = http.post(`${BASE_URL}/promotion/vouchers/validate`, validatePayload, memberParams);
        check(valRes, { 'member voucher validation 200 or 400': (r) => r.status === 200 || r.status === 400 || r.status === 429 });
    }
    sleep(1);

    // 6. Create Order (Transfer)
    const orderPayload = JSON.stringify({
        tableSessionId: tableSessionId,
        paymentMethod: 'Transfer',
        voucherCode: voucherCode,
        note: 'Member Checkout Load Test'
    });
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, memberParams);
    if (!check(orderRes, { 'member order 201': (r) => r.status === 201 })) {
        sleep(1); return;
    }
    const orderId = orderRes.json('id');
    const finalTotal = orderRes.json('finalAmount') || orderTotal;

    // 7. Initialize Payment
    const paymentPayload = JSON.stringify({
        orderId: orderId,
        amount: finalTotal,
        voucherCode: voucherCode,
        tableSessionId: tableSessionId,
        tableNumber: 'TEST-TABLE',
        note: 'SePay Payment Init'
    });
    const payRes = http.post(`${BASE_URL}/payments`, paymentPayload, memberParams);
    if (!check(payRes, { 'member payment initialized 200': (r) => r.status === 200 })) {
        sleep(1); return;
    }
    sleep(1);

    // 8. Mock SePay Webhook
    const webhookPayload = JSON.stringify({
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000), // Duy nhất tuyệt đối
        gateway: "VietQR",
        transactionDate: new Date().toISOString(),
        accountNumber: "123456789",
        code: "00",
        content: `SEVQR ${orderId}`,
        transferType: "in",
        transferAmount: finalTotal,
        accumulated: 100000,
        subAccount: "Sub1",
        referenceCode: orderId,
        description: "Payment successful"
    });

    const webhookParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Apikey ${SEPAY_API_KEY}`,
            'Connection': 'keep-alive'
        },
        timeout: '15s'
    };
    const webhookRes = http.post(`${BASE_URL}/payments/webhook/sepay`, webhookPayload, webhookParams);
    check(webhookRes, { 'sepay webhook mock 200': (r) => r.status === 200 });

    sleep(2);
}

// ============================================
// CHAOS TESTING FLOW (Simulating Faults, Duplicates, and Malformed Requests)
// ============================================
export function chaosFlow() {
    // 1. Gửi request Webhook SePay trùng lặp cố ý để kiểm tra tính toàn vẹn Idempotency (bắt lỗi 23505)
    const duplicateOrderId = 'chaos-test-order-' + Math.floor(Math.random() * 100);
    const fixedTransactionId = 9999999999; // ID cố định gây trùng lặp
    const webhookPayload = JSON.stringify({
        id: fixedTransactionId,
        gateway: "VietQR",
        transactionDate: new Date().toISOString(),
        accountNumber: "123456789",
        code: "00",
        content: `SEVQR ${duplicateOrderId}`,
        transferType: "in",
        transferAmount: 50000,
        accumulated: 50000,
        subAccount: "Sub1",
        referenceCode: duplicateOrderId,
        description: "Chaos duplicate webhook injection"
    });

    const webhookParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Apikey ${SEPAY_API_KEY}`,
            'Connection': 'keep-alive'
        },
        timeout: '5s' // Timeout rất ngắn để thử thách ngắt kết nối
    };

    // Gửi lần 1
    http.post(`${BASE_URL}/payments/webhook/sepay`, webhookPayload, webhookParams);
    // Gửi lần 2 ngay lập tức để ép DB bẫy lỗi Unique Constraint (23505)
    const resDup = http.post(`${BASE_URL}/payments/webhook/sepay`, webhookPayload, webhookParams);
    check(resDup, { 'chaos duplicate handled gracefully': (r) => r.status === 200 || r.status === 400 || r.status === 409 || r.status === 500 });

    // 2. Gửi request Malformed JSON để kiểm tra khả năng phục hồi của Gateway/Service
    const malformedParams = {
        headers: { 'Content-Type': 'application/json' },
        timeout: '5s'
    };
    const resMalformed = http.post(`${BASE_URL}/cart`, '{ bad_json: "missing_quotes }', malformedParams);
    check(resMalformed, { 'chaos malformed json caught (400)': (r) => r.status === 400 });

    // 3. Gọi endpoint không tồn tại để kiểm tra bẫy lỗi 404
    const resNotFound = http.get(`${BASE_URL}/non-existent-service-endpoint`, { timeout: '5s' });
    check(resNotFound, { 'chaos 404 caught': (r) => r.status === 404 });

    sleep(1);
}
