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

// Bước chuẩn bị: Đăng ký tài khoản test nếu chưa có
export function setup() {
    http.post(`${BASE_URL}/identity/register`,
        JSON.stringify({
            username: 'k6user',
            email: 'k6user@test.com',
            password: 'Test@1234',
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );
}

export default function () {
    // 1. Đăng nhập để lấy Token (Cần thiết cho Cart và Order)
    const loginRes = http.post(`${BASE_URL}/identity/login`,
        JSON.stringify({ username: 'k6user', password: 'Test@1234' }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    
    const token = loginRes.json('token');
    const authHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    };

    // 2. Xem danh sách món ăn (Public API)
    const catalogRes = http.get(`${BASE_URL}/catalog/foods`);
    check(catalogRes, { 'catalog 200': (r) => r.status === 200 });

    sleep(1);

    // 3. Thêm món vào giỏ hàng (Private API - Cần Token)
    const cartPayload = JSON.stringify({
        cartOwnerId: 'k6user', // Đồng nhất với user đăng nhập
        items: [{ foodId: '1', quantity: 2 }]
    });
    const cartRes = http.post(`${BASE_URL}/cart`, cartPayload, { headers: authHeaders });
    check(cartRes, { 'cart update 200': (r) => r.status === 200 });

    sleep(1);

    // 4. Đặt đơn hàng (Private API - Cần Token)
    const orderPayload = JSON.stringify({
        tableId: 'table-01',
        items: [{ foodId: '1', quantity: 2 }],
        note: 'K6 Load Test with Token'
    });
    // Sửa lỗi typo: dùng orderPayload thay vì orderRes
    const orderRes = http.post(`${BASE_URL}/orders`, orderPayload, { headers: authHeaders });
    check(orderRes, { 'order success 200': (r) => r.status === 200 });

    sleep(2);
}
