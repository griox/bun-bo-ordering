import http from 'k6/http';
import { sleep, check, fail } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 200 }, // Ramp up to 200 VUs
        { duration: '5m', target: 200 }, // Stay at 200 VUs for 5 minutes
        { duration: '1m', target: 0 },   // Ramp down to 0 VUs
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'], // Expect 95% of requests to complete within 3s
        http_req_failed: ['rate<0.05'],    // Less than 5% failure rate
    },
};

const BASE_URL = 'https://api.bun-bo-chung-cu.io.vn/api';

// Danh sách bàn được lấy từ Production
const TABLE_IDS = [
    'f962d655-e0a5-4d64-b40a-d989921dfaf5',
    '9395339b-f83e-4482-b215-48e9e428a922',
    'dfdab3f3-163d-4535-9f07-321da5991b57',
    'cf39f952-53c0-4a6b-ac25-8e64cb816612'
];

export default function () {
    // Chọn ngẫu nhiên 1 bàn
    const TABLE_ID = TABLE_IDS[Math.floor(Math.random() * TABLE_IDS.length)];

    // 1. Quét mã QR tại bàn để mở Session (Guest bắt đầu gọi món)
    const scanRes = http.post(`${BASE_URL}/orders/tables/${TABLE_ID}/scan`);
    
    if (!check(scanRes, { 
        'table scanned 200': (r) => r.status === 200,
        'has sessionId': (r) => {
            try { return r.json('sessionId') !== undefined; } catch(e) { return false; }
        }
    })) {
        console.error(`Scan Failed: ${scanRes.status} - ${scanRes.body}`);
        sleep(1); // Ngăn chặn vòng lặp DDoS nếu server lỗi
        return;
    }
    
    const tableSessionId = scanRes.json('sessionId');

    // 2. Khách xem menu (Public API)
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`);
    let foodId = 'f05468de-5acf-4fd0-bbf5-a9a6a1407c8f'; // Fallback

    if (check(catalogRes, { 'catalog 200': (r) => r.status === 200 })) {
        try {
            const foods = catalogRes.json();
            if (foods && foods.length > 0) {
                // Chọn ngẫu nhiên 1 món từ menu thật
                foodId = foods[Math.floor(Math.random() * foods.length)].id;
            }
        } catch (e) {
            console.warn("Failed to parse catalog JSON, using fallback foodId");
        }
    } else {
        console.error(`Catalog Failed: ${catalogRes.status}`);
    }
    sleep(1);

    // 3. Khách thêm món vào giỏ hàng (Cart Service - Public)
    const cartPayload = JSON.stringify({
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId: foodId, quantity: Math.floor(Math.random() * 3) + 1 }]
        }
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    
    if (!check(cartRes, { 'guest cart update 200': (r) => r.status === 200 })) {
        console.error(`Cart Update Failed: ${cartRes.status} - ${cartRes.body}`);
        sleep(1); // Ngăn chặn vòng lặp DDoS nếu server lỗi
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
