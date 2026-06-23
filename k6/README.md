# Load Testing — TrackMa k6 Scripts

## Prerequisites

```bash
# Install k6
winget install k6          # Windows
brew install k6            # macOS
sudo apt install k6        # Ubuntu (after adding Grafana apt repo)
```

## Scripts

| Script | VUs | Duration | Purpose |
|---|---|---|---|
| `smoke.js` | 1 | 30 s | Quick sanity check before bigger runs |
| `load.js` | 0→50 | ~6 min | Peak load validation (p95 targets) |
| `soak.js` | 20 | 10 min | Memory leak / drift detection |

## Running

```bash
# Smoke — local dev server must be running
k6 run k6/smoke.js

# Load — against staging
BASE_URL=https://api.staging.trackma.ma \
  TEST_EMAIL=load@trackma.ma \
  TEST_PASSWORD=LoadTest123! \
  k6 run k6/load.js

# Soak
BASE_URL=https://api.staging.trackma.ma \
  TEST_EMAIL=load@trackma.ma \
  TEST_PASSWORD=LoadTest123! \
  k6 run k6/soak.js

# Output JSON summary for CI
k6 run --out json=k6-results.json k6/load.js
```

## Pass/Fail Thresholds

| Metric | Threshold |
|---|---|
| `http_req_failed` | < 1% |
| `http_req_duration p(95)` | < 500 ms |
| `http_req_duration p(99)` | < 1 000 ms |
| `position_latency p(95)` | < 300 ms |
| `vehicle_latency p(95)` | < 400 ms |
| `alert_latency p(95)` | < 400 ms |

k6 exits with code 99 when any threshold is breached — integrate into CI with:

```yaml
- name: Load test
  run: k6 run --out json=k6-results.json k6/smoke.js
  env:
    BASE_URL: ${{ secrets.STAGING_API_URL }}
```
