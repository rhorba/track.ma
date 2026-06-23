# Load Testing Report — TrackMa API

## Methodology

Three k6 test tiers cover different risk profiles:

| Tier | Script | VUs | Duration | Goal |
|---|---|---|---|---|
| Smoke | `k6/smoke.js` | 1 | 30 s | Confirm baseline works |
| Load | `k6/load.js` | 0→50 | ~6 min | Validate under peak traffic |
| Soak | `k6/soak.js` | 20 | 10 min | Detect drift / memory leaks |

## P95 Latency Targets

These targets are derived from user-experience requirements:

| Endpoint | P95 Target | Rationale |
|---|---|---|
| `GET /fleet/positions` | < 300 ms | Live map — refreshes every 10 s; perceptible lag |
| `GET /vehicles` | < 400 ms | Dashboard list — user-initiated |
| `GET /alerts` | < 400 ms | Dashboard widget — user-initiated |
| `GET /reports/summary` | < 800 ms | Report page — acceptable slight delay |
| `GET /reports/by-vehicle` | < 1 000 ms | Analytics — complex aggregation |
| All endpoints combined | < 500 ms p95 / < 1 000 ms p99 | Global SLA |

## Bottleneck Analysis

### Expected bottlenecks at 50 VUs

1. **`GET /fleet/positions`** — Reads Redis latest-position cache per vehicle. At 50 VUs polling every ~1–2 s, expect ~30–50 Redis GET/s. Redis single-threaded but fast; bottleneck will be NestJS serialization, not Redis. Target: < 300 ms p95.

2. **`GET /reports/by-vehicle`** — GROUP BY + SUM across `gps_positions` table. Covered by `(vehicle_id, started_at)` index from Sprint 6 perf audit. At 50 VUs with 20% sampling (≈10 VUs hitting it), expect < 800 ms p95 on < 100k rows.

3. **Connection pool** — TypeORM default pool size is 10. At 50 VUs hitting DB-backed endpoints, pool exhaustion is the primary soak-test risk. Recommendation: set `extra.max: 25` in TypeORM config for staging.

4. **JWT verification** — Symmetric HS256 is fast (< 1 ms). Not a bottleneck at this scale.

### Scaling thresholds

| Users (fleet managers, concurrent) | Expected VUs | Action required |
|---|---|---|
| < 100 orgs, < 500 vehicles | ~10–20 VUs | Current setup handles this |
| 100–500 orgs | ~50 VUs | Increase DB pool to 25, add Redis replica |
| 500+ orgs | 100+ VUs | Add read replica, consider horizontal scaling |

## TypeORM Connection Pool Recommendation

Add to `apps/api/src/app.module.ts` TypeOrmModule config:

```typescript
extra: {
  max: 25,           // pool size (default: 10)
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
},
```

## CI Integration

Run smoke test on every PR merge to `main` against staging:

```yaml
# In .github/workflows/ci.yml — add after e2e job
load-smoke:
  needs: e2e
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v4
    - name: Install k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
          --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
          | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update && sudo apt-get install k6
    - name: Smoke test
      run: k6 run k6/smoke.js
      env:
        BASE_URL: ${{ secrets.STAGING_API_URL }}
        TEST_EMAIL: ${{ secrets.LOAD_TEST_EMAIL }}
        TEST_PASSWORD: ${{ secrets.LOAD_TEST_PASSWORD }}
```

## Post-Launch Actions

After real traffic:
1. Baseline p95 from Grafana/Datadog
2. If `GET /reports/by-vehicle` > 800 ms — add materialized view or schedule nightly aggregation
3. If connection pool exhaustion observed in soak — bump `max` to 50 and add PgBouncer
4. Re-run load test after each major feature sprint
