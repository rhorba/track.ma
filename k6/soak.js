/**
 * Soak test — 20 VUs sustained for 10 minutes
 * Detects memory leaks, connection pool exhaustion, and response time drift.
 * Run: k6 run k6/soak.js
 *
 * Watch for: p95 climbing over time (drift), error rate increasing after ~5 min.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:3001/api';
const EMAIL = __ENV.TEST_EMAIL || 'demo@trackma.ma';
const PASSWORD = __ENV.TEST_PASSWORD || 'Demo1234!';

// Track latency per 1-min window to detect drift
const p1Latency = new Trend('p1_position_latency', true);

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // ramp up
    { duration: '8m', target: 20 },   // hold — watch for drift
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],          // allow slightly higher threshold for soak
    http_req_duration: ['p(95)<800'],        // relaxed vs load test — watch for drift
    p1_position_latency: ['p(95)<500'],
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
  const headers = { Authorization: `Bearer ${data.token}` };

  const r = http.get(`${BASE}/fleet/positions`, { headers });
  p1Latency.add(r.timings.duration);
  check(r, { 'positions ok': (r) => r.status === 200 });

  http.get(`${BASE}/vehicles`, { headers });
  http.get(`${BASE}/alerts`, { headers });

  // Occasionally hit a heavier endpoint to stress DB connection pool
  if (Math.random() < 0.1) {
    http.get(`${BASE}/reports/by-vehicle?from=2026-01-01`, { headers });
  }

  sleep(3);
}
