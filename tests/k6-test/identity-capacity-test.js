/**
 * Identity Service — Capacity / Steady-State Test
 *
 * Mục tiêu: Tìm ngưỡng tải tối đa mà 3 pods vẫn đáp ứng < 2s (p95)
 *
 * Chạy TRƯỚC khi test này: đảm bảo HPA đã scale lên 3 pods
 *   kubectl scale deployment identity-service --replicas=3
 *
 * Kịch bản: Giữ tải cố định ở các mức để đo hiệu năng từng mức
 */
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    // Giữ mức tải cố định (không ramp) để đo capacity thực sự
    scenarios: {
        low_load: {
            executor: 'constant-vus',
            vus: 20,
            duration: '1m',
            startTime: '0s',
            tags: { scenario: 'low_load' },
        },
        medium_load: {
            executor: 'constant-vus',
            vus: 40,
            duration: '1m',
            startTime: '1m30s',
            tags: { scenario: 'medium_load' },
        },
        high_load: {
            executor: 'constant-vus',
            vus: 80,
            duration: '1m',
            startTime: '3m',
            tags: { scenario: 'high_load' },
        },
        peak_load: {
            executor: 'constant-vus',
            vus: 120,
            duration: '1m',
            startTime: '4m30s',
            tags: { scenario: 'peak_load' },
        },
    },
    thresholds: {
        // Ngưỡng pass/fail cho từng mức
        'http_req_duration{scenario:low_load}': ['p(95)<500'],   // Low: < 500ms
        'http_req_duration{scenario:medium_load}': ['p(95)<1000'],  // Med: < 1s
        'http_req_duration{scenario:high_load}': ['p(95)<2000'],  // High: < 2s
        'http_req_duration{scenario:peak_load}': ['p(95)<5000'],  // Peak: < 5s
        'http_req_failed': ['rate<0.05'],   // Tổng lỗi < 5%
    },
};

const BASE = 'https://api.bun-bo-chung-cu.io.vn/api/identity';

export function setup() {
    // Đảm bảo user test tồn tại
    const reg = http.post(`${BASE}/register`,
        JSON.stringify({ username: 'k6cap', email: 'k6cap@test.com', password: 'Test@1234' }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(`Setup: ${reg.status} — user k6cap ready`);
}

export default function () {
    // Login
    const loginRes = http.post(`${BASE}/login`,
        JSON.stringify({ username: 'k6cap', password: 'Test@1234' }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    const ok = check(loginRes, {
        'login 200': (r) => r.status === 200,
        'has token': (r) => r.json('token') != null,
    });

    if (!ok) { sleep(0.5); return; }

    // Profile call (mô phỏng user đã login → gọi endpoint có thực)
    const token = loginRes.json('token');
    const usersRes = http.get(`${BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    // 200 = admin OK, 403 = non-admin (vẫn authed) → đều là kết quả hợp lệ
    check(usersRes, { 'authed request ok': (r) => r.status === 200 || r.status === 403 });

    sleep(0.3);
}
