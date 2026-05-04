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

export default function () {
    // Không đăng nhập, không dùng Token
    const guestSessionId = `guest-session-${__VU}-${__ITER}`;

    // 1. Khách xem menu (Public API)
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`);
    check(catalogRes, { 'catalog 200': (r) => r.status === 200 });
    sleep(1);

    // 2. Khách thêm món vào giỏ hàng (Cart Service - Nay đã là Public)
    const cartPayload = JSON.stringify({
        cartOwnerId: guestSessionId, // Dùng Session ID thay vì User ID
        items: [{ foodId: '1', quantity: 2 }]
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    check(cartRes, { 'guest cart update 200': (r) => r.status === 200 });
    sleep(1);

    // 3. Khách đặt đơn hàng (Order Service - Chấp nhận Guest)
    const orderPayload = JSON.stringify({
        tableId: 'table-01',
        items: [{ foodId: '1', quantity: 2 }],
        note: 'Guest Checkout Load Test'
    });
    
    // Gửi request KHÔNG có header Authorization
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, { 
        headers: { 'Content-Type': 'application/json' } 
    });
    check(orderRes, { 'guest order success 200/201': (r) => r.status === 200 || r.status === 201 });
    sleep(2);
}
