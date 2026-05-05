import http from 'k6/http';
import { sleep, check, fail } from 'k6';

export const options = {
    // Run a short, light test to see the result quickly and apply TDD
    vus: 5,
    duration: '10s',
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = 'https://api.bun-bo-chung-cu.io.vn/api';

// Bàn cố định được lấy từ Database Production
const TABLE_ID = 'dfdab3f3-163d-4535-9f07-321da5991b57';
// Món ăn có thực từ Catalog
const FOOD_ID = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f';

export default function () {
    // 1. Quét mã QR tại bàn để mở Session (Guest bắt đầu gọi món)
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`);
    
    if (!check(scanRes, { 
        'table scanned 200': (r) => r.status === 200,
        'has sessionId': (r) => {
            try { return r.json('sessionId') !== undefined; } catch(e) { return false; }
        }
    })) {
        console.error(`Scan Failed: ${scanRes.status} - ${scanRes.body}`);
        return; // Dừng lại nếu không lấy được session
    }
    
    const tableSessionId = scanRes.json('sessionId');

    // 2. Khách xem menu (Public API)
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`);
    if (!check(catalogRes, { 'catalog 200': (r) => r.status === 200 })) {
        console.error(`Catalog Failed: ${catalogRes.status} - ${catalogRes.body}`);
    }
    sleep(1);

    // 3. Khách thêm món vào giỏ hàng (Cart Service - Public)
    const cartPayload = JSON.stringify({
        cartOwnerId: tableSessionId,
        items: [{ foodId: FOOD_ID, quantity: 2 }]
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    
    if (!check(cartRes, { 'guest cart update 200': (r) => r.status === 200 })) {
        console.error(`Cart Update Failed: ${cartRes.status} - ${cartRes.body}`);
        return; // Dừng lại nếu không thêm giỏ hàng được
    }
    sleep(1);

    // 4. Khách đặt đơn hàng (Order Service)
    const orderPayload = JSON.stringify({
        tableSessionId: tableSessionId,
        paymentMethod: 'Cash',
        note: 'Guest Checkout Load Test'
    });
    
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    
    if (!check(orderRes, { 'guest order success 201': (r) => r.status === 201 })) {
        console.error(`Order Failed: ${orderRes.status} - ${orderRes.body}`);
    }
    sleep(2);
}
