/**
 * Load test — ramp 0→50 VUs over 2 min, hold 3 min, ramp down 1 min (total ~6 min)
 * Target: p95 < 500 ms on all endpoints, error rate < 1%.
 * Run: k6 run k6/load.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:3001/api';
const EMAIL = __ENV.TEST_EMAIL || 'demo@trackma.ma';
const PASSWORD = __ENV.TEST_PASSWORD || 'Demo1234!';

const errorRate = new Rate('errors');
const positionLatency = new Trend('position_latency', true);
const vehicleLatency = new Trend('vehicle_latency', true);
const alertLatency = new Trend('alert_latency', true);

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // ramp up
    { duration: '3m', target: 50 },  // hold
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    position_latency: ['p(95)<300'],   // fleet positions must be fast
    vehicle_latency: ['p(95)<400'],
    alert_latency: ['p(95)<400'],
    errors: ['rate<0.01'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'setup login ok': (r) => r.status === 200 });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Fleet positions — most frequent endpoint (live map polling)
  let r = http.get(`${BASE}/fleet/positions`, { headers });
  positionLatency.add(r.timings.duration);
  errorRate.add(r.status !== 200);
  check(r, { 'fleet positions ok': (r) => r.status === 200 });

  // Vehicle list
  r = http.get(`${BASE}/vehicles`, { headers });
  vehicleLatency.add(r.timings.duration);
  errorRate.add(r.status !== 200);
  check(r, { 'vehicles ok': (r) => r.status === 200 });

  // Alerts (real-time dashboard widget)
  r = http.get(`${BASE}/alerts`, { headers });
  alertLatency.add(r.timings.duration);
  errorRate.add(r.status !== 200);
  check(r, { 'alerts ok': (r) => r.status === 200 });

  // Reports summary (less frequent, heavier query)
  if (Math.random() < 0.2) {
    r = http.get(`${BASE}/reports/summary`, { headers });
    errorRate.add(r.status !== 200);
    check(r, { 'reports ok': (r) => r.status === 200 });
  }

  sleep(Math.random() * 2 + 0.5); // 0.5–2.5s think time
}
