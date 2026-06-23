/**
 * Smoke test — 1 VU, 30 s
 * Verifies the critical path works before running larger tests.
 * Run: k6 run k6/smoke.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:3001/api';
const EMAIL = __ENV.TEST_EMAIL || 'demo@trackma.ma';
const PASSWORD = __ENV.TEST_PASSWORD || 'Demo1234!';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],       // <1% errors
    http_req_duration: ['p(95)<500'],     // p95 < 500ms
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // GET /fleet/positions
  const pos = http.get(`${BASE}/fleet/positions`, { headers });
  check(pos, { 'positions 200': (r) => r.status === 200 });

  // GET /vehicles
  const veh = http.get(`${BASE}/vehicles`, { headers });
  check(veh, { 'vehicles 200': (r) => r.status === 200 });

  // GET /alerts
  const alerts = http.get(`${BASE}/alerts`, { headers });
  check(alerts, { 'alerts 200': (r) => r.status === 200 });

  // GET /organizations/me/usage
  const usage = http.get(`${BASE}/organizations/me/usage`, { headers });
  check(usage, { 'usage 200': (r) => r.status === 200 });

  // GET /reports/summary
  const summary = http.get(`${BASE}/reports/summary`, { headers });
  check(summary, { 'summary 200': (r) => r.status === 200 });

  sleep(1);
}
