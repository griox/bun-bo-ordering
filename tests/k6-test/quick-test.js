import { guestFlow, memberFlow, kitchenAdminFlow, voucherRaceFlow, chaosFlow, setup, teardown } from './full-flow-load-test.js';

export { guestFlow, memberFlow, kitchenAdminFlow, voucherRaceFlow, chaosFlow, setup, teardown };

export const options = {
    setupTimeout: '300s',
    scenarios: {
        guest_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 60 },
                { duration: '30s', target: 60 },
                { duration: '10s', target: 0 },
            ],
            exec: 'guestFlow',
            tags: { flow: 'guestFlow' },
        },
        member_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 50 },
                { duration: '30s', target: 50 },
                { duration: '10s', target: 0 },
            ],
            exec: 'memberFlow',
            tags: { flow: 'memberFlow' },
        },
        kitchen_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 15 },
                { duration: '30s', target: 15 },
                { duration: '10s', target: 0 },
            ],
            exec: 'kitchenAdminFlow',
            tags: { flow: 'kitchenAdminFlow' },
            startTime: '5s',
        },
        voucher_race: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 15 },
                { duration: '30s', target: 15 },
                { duration: '10s', target: 0 },
            ],
            exec: 'voucherRaceFlow',
            tags: { flow: 'voucherRaceFlow' },
        },
        chaos_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '15s', target: 10 },
                { duration: '30s', target: 10 },
                { duration: '10s', target: 0 },
            ],
            exec: 'chaosFlow',
            tags: { flow: 'chaosFlow' },
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed':   ['rate<0.1'],
    }
};
