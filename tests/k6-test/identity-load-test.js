import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 10 }, // Ramp-up
        { duration: '1m', target: 40 }, // Load
        { duration: '1m', target: 60 }, // Stress → kích HPA scale
        { duration: '30s', target: 0 }, // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'], // 95% request < 5s
        http_req_failed: ['rate<0.10'],  // Lỗi < 10%
    },
};

const BASE = 'https://api.bun-bo-chung-cu.io.vn/api/identity'; // ✅ subdomain API đúng

// Chạy 1 lần trước toàn bộ test: tạo tài khoản test
export function setup() {
    const reg = http.post(`${BASE}/register`,
        JSON.stringify({
            username: 'k6loadtest',
            email: 'k6loadtest@test.com',
            password: 'Test@1234',
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`Setup register status: ${reg.status}`); // 200 = tạo mới, 400 = đã có sẵn
}

// Kịch bản chạy cho mỗi Virtual User
export default function () {
    // 1. Login
    const loginRes = http.post(`${BASE}/login`,
        JSON.stringify({ username: 'k6loadtest', password: 'Test@1234' }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    const ok = check(loginRes, {
        'login 200': (r) => r.status === 200,
        'has token': (r) => r.json('token') != null, // ✅ field là 'token', không phải 'accessToken'
    });

    if (!ok) {
        console.log(`Login failed: ${loginRes.status} - ${loginRes.body}`);
        sleep(1);
        return;
    }

    const token = loginRes.json('token'); // ✅ sửa đúng field

    // 2. Gọi profile (authenticated)
    const profileRes = http.get(`${BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    check(profileRes, { 'profile 200': (r) => r.status === 200 });

    sleep(0.5);
}
