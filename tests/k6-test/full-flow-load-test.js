import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 150 },
        { duration: '30s', target: 0 },
    ],
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
    check(scanRes, { 'table scanned 200': (r) => r.status === 200 });
    
    // Lấy ID của phiên làm việc (Session)
    let tableSessionId = '';
    try {
        tableSessionId = scanRes.json('sessionId');
    } catch(e) {}

    // 2. Khách xem menu (Public API)
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`);
    check(catalogRes, { 'catalog 200': (r) => r.status === 200 });
    sleep(1);

    // 3. Khách thêm món vào giỏ hàng (Cart Service - Public)
    // Lưu ý quan trọng: CartOwnerId CHÍNH LÀ TableSessionId
    const cartPayload = JSON.stringify({
        cart: {
            cartOwnerId: tableSessionId,
            items: [{ foodId: FOOD_ID, quantity: 2 }]
        }
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    check(cartRes, { 'guest cart update 200': (r) => r.status === 200 });
    sleep(1);

    // 4. Khách đặt đơn hàng (Order Service)
    const orderPayload = JSON.stringify({
        tableSessionId: tableSessionId,
        paymentMethod: 'Cash', // Bắt buộc phải có PaymentMethod
        note: 'Guest Checkout Load Test'
    });
    
    // Gửi request KHÔNG có header Authorization
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    check(orderRes, { 'guest order success 201': (r) => r.status === 201 });
    sleep(2);
}
