# Development Guide — TrackMa

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22+ | https://nodejs.org/ |
| pnpm | 10+ | `npm install -g pnpm` |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop/ |
| Git | any | https://git-scm.com/ |

## Initial Setup

```bash
git clone https://github.com/rhorba/track.ma.git
cd track.ma
pnpm install
cp .env.example .env
```

Edit `.env` — the minimum required values to start locally:

```env
DATABASE_URL=postgresql://trackma:trackma_pass@localhost:5432/trackma
REDIS_URL=redis://localhost:6379
JWT_SECRET=any-long-random-string-here
JWT_REFRESH_SECRET=another-long-random-string
MQTT_BROKER_URL=mqtt://localhost:1883
NEXTAUTH_SECRET=any-random-string
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
APP_URL=http://localhost:3000
NODE_ENV=development
```

Stripe and SMTP vars are only needed when testing billing/email features. See [stripe-setup.md](stripe-setup.md).

## Running the Stack

### Option A — Full Docker (recommended for first run)

```bash
docker compose up
```

All services start: postgres, redis, mosquitto, api, gps-ingestion, web. Hot reload is enabled for all three apps via volume mounts.

### Option B — Infrastructure in Docker, apps locally (faster iteration)

```bash
# Start only the infrastructure services
docker compose up -d postgres redis mosquitto

# Start all three apps in parallel with hot reload
pnpm dev
```

Individual apps:

```bash
pnpm --filter api dev              # Core API on :3001
pnpm --filter gps-ingestion dev    # GPS Ingestion on :3002
pnpm --filter web dev              # Next.js on :3000
```

## Service URLs

| Service | URL | Notes |
|---|---|---|
| Web App | http://localhost:3000 | Next.js dashboard |
| Core API | http://localhost:3001/api | REST endpoints |
| API Health | http://localhost:3001/api/health | Should return `{ status: "ok" }` |
| GPS Ingestion | http://localhost:3002 | No UI, logs to stdout |
| MQTT Broker | mqtt://localhost:1883 | Mosquitto |
| MQTT WebSocket | ws://localhost:9001 | For browser-based MQTT clients |
| PostgreSQL | localhost:5432 | DB: `trackma`, User: `trackma`, Pass: `trackma_pass` |
| Redis | localhost:6379 | No password in dev |

## Database

The database schema is managed by TypeORM `synchronize: true` in development — it automatically applies entity changes on startup. **Never use synchronize in production** (see [deployment.md](deployment.md)).

### Connecting to the DB

```bash
# Via Docker
docker compose exec postgres psql -U trackma -d trackma

# Via any PostgreSQL client (TablePlus, DBeaver, psql)
# Host: localhost, Port: 5432, DB: trackma, User: trackma, Pass: trackma_pass
```

### Useful queries

```sql
-- List all vehicles and their latest status
SELECT id, name, plate, imei, status FROM vehicles WHERE is_active = true;

-- Recent positions for a vehicle
SELECT lat, lng, speed, ignition, timestamp
FROM positions
WHERE vehicle_id = '<uuid>'
ORDER BY timestamp DESC
LIMIT 20;

-- Active alert rules
SELECT name, type, config FROM alert_rules WHERE is_active = true;
```

## Simulating GPS Data

While real devices are not connected, you can simulate positions by publishing MQTT messages.

### Using mosquitto_pub (CLI)

```bash
# Install mosquitto-clients or use Docker
docker compose exec mosquitto mosquitto_pub \
  -h localhost \
  -t "trackma/devices/123456789012345/position" \
  -m '{"lat":33.5731,"lng":-7.5898,"speed":45,"heading":90,"ignition":true,"fuelLevel":72,"timestamp":"2026-06-22T10:00:00Z"}'
```

### Using the built-in simulator (Sprint 6)

Once Sprint 6 is complete, run:

```bash
pnpm --filter api run simulate
```

This seeds 5 fake vehicles and moves them around Casablanca in real time.

## Testing

```bash
pnpm test              # All unit tests
pnpm test:cov          # Tests + coverage report (target ≥ 80%)
pnpm --filter api test                  # API tests only
pnpm --filter gps-ingestion test        # GPS ingestion tests only
```

Coverage reports output to `apps/api/coverage/` and `apps/gps-ingestion/coverage/`.

## Linting & Formatting

```bash
pnpm lint              # ESLint all packages
pnpm --filter api lint --fix   # Auto-fix linting issues in API
```

## Building

```bash
pnpm build             # Build all packages
pnpm --filter api build        # Build API only
pnpm --filter web build        # Build Next.js (outputs .next/)
```

## Git Workflow

```
main        → production-ready, protected
develop     → integration branch
feature/*   → individual features (from develop)
fix/*       → bug fixes
```

Commit message format: `type(scope): description`

| Type | Use for |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build, deps, config |
| `refactor` | Code restructure (no behavior change) |
| `test` | Tests only |
| `docs` | Documentation only |

Examples:
```
feat(vehicles): add IMEI validation on device pairing
fix(alerts): prevent duplicate speeding alerts within 5 min window
chore(deps): upgrade ioredis to 5.4.2
```

## Environment Variables Reference

See [.env.example](../.env.example) for the full list with descriptions. Key vars:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | — | Redis connection string |
| `JWT_SECRET` | ✅ | — | Access token signing secret (64+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token signing secret |
| `MQTT_BROKER_URL` | ✅ | mqtt://localhost:1883 | MQTT broker address |
| `STRIPE_SECRET_KEY` | billing only | — | Stripe secret key (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | billing only | — | Stripe webhook signing secret |
| `SMTP_HOST` | email alerts | — | SMTP server hostname |
| `SMTP_USER` | email alerts | — | SMTP username/email |
| `SMTP_PASS` | email alerts | — | SMTP password or app password |
| `NEXT_PUBLIC_API_URL` | ✅ | http://localhost:3001 | API URL visible to browser |
| `NEXT_PUBLIC_WS_URL` | ✅ | ws://localhost:3001 | WebSocket URL visible to browser |

## Troubleshooting

**Port already in use**
```bash
# Find what's using port 3001
npx kill-port 3001
```

**Database connection refused**
```bash
docker compose ps        # Check postgres is running and healthy
docker compose logs postgres
```

**MQTT not receiving messages**
```bash
docker compose logs mosquitto
# Subscribe to all topics to debug
docker compose exec mosquitto mosquitto_sub -h localhost -t '#' -v
```

**TypeScript errors after pulling**
```bash
pnpm install             # Dependencies may have changed
pnpm --filter api build  # Check for compile errors
```

**Redis connection issues**
```bash
docker compose exec redis redis-cli ping   # Should return PONG
```
