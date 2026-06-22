# DevOps Guide — TrackMa

**Author**: DevOps / DevSecOps  
**Date**: 2026-06-22

---

## CI/CD Pipeline

### Current Pipeline (`.github/workflows/ci.yml`)

```
Trigger: push or PR to main / develop

Jobs:
  lint-and-test:
    1. Checkout code
    2. Setup pnpm + Node 22
    3. pnpm install --frozen-lockfile
    4. Lint: api, gps-ingestion, web
    5. Test: api (with real PostgreSQL + Redis services)
    6. Test: gps-ingestion
    7. Build: api, gps-ingestion, web
```

### CI Environment Services

The CI spins up real PostgreSQL and Redis for integration tests:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env: { POSTGRES_DB: trackma_test, POSTGRES_USER: trackma, ... }
  redis:
    image: redis:7-alpine
```

### CI Status Rules

- **PR to main**: CI must be GREEN before merge allowed
- **Push to main**: CI runs + triggers deploy to staging (Sprint 6)
- **Failed CI**: Stop all other work, diagnose, fix, push again. No exceptions.

### Monitoring CI

```bash
# View CI run status
gh run list --repo rhorba/track.ma

# View failing run logs
gh run view <run-id> --log-failed
```

---

## Docker Infrastructure

### Development Stack

```bash
docker compose up -d              # Start all services
docker compose up -d postgres redis mosquitto  # Infrastructure only
docker compose logs -f api        # Tail API logs
docker compose exec postgres psql -U trackma -d trackma  # DB shell
docker compose exec redis redis-cli  # Redis CLI
docker compose restart api        # Restart a single service
docker compose down               # Stop all (data preserved)
docker compose down -v            # Stop all + delete volumes (DESTROYS DATA)
```

### Checking Service Health

```bash
docker compose ps

# Expected output:
# NAME           STATUS              PORTS
# postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
# redis          Up (healthy)        0.0.0.0:6379->6379/tcp
# mosquitto      Up (healthy)        0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
# api            Up                  0.0.0.0:3001->3001/tcp
# gps-ingestion  Up                  0.0.0.0:3002->3002/tcp
# web            Up                  0.0.0.0:3000->3000/tcp
```

---

## Infrastructure Hardening (Sprint 6 Checklist)

### Docker Compose Production

```yaml
# Services that should NOT be externally accessible:
postgres:
  # Remove external port mapping:
  # ports: ["5432:5432"]  ← DELETE THIS in production

redis:
  # Remove external port mapping:
  # ports: ["6379:6379"]  ← DELETE THIS in production
  # Add password:
  command: redis-server --requirepass ${REDIS_PASSWORD}
```

### Nginx Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org;";
```

### Container Hardening

```dockerfile
# Run as non-root user in production images
FROM base AS prod
RUN addgroup -S trackma && adduser -S trackma -G trackma
USER trackma
```

---

## Logging

### Development

All services log to Docker stdout. View with:

```bash
docker compose logs -f              # All services
docker compose logs -f api          # API only
docker compose logs -f --tail=50 api  # Last 50 lines
```

### Production Log Format (Sprint 6)

Switch NestJS to JSON logging for easier aggregation:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: process.env.NODE_ENV === 'production'
    ? new StructuredLogger()
    : new Logger(),
});
```

Log levels by environment:
- Development: `verbose` (all logs)
- Production: `warn` and `error` only (reduce noise)

### Key Log Events to Capture

```
AUTH: login_success, login_failure (with IP), register_success
VEHICLE: vehicle_created, vehicle_deleted
ALERT: alert_triggered (with type, vehicleId, value), email_sent, email_failed
GPS: position_received, unknown_imei (for device registration debugging)
BILLING: checkout_created, subscription_updated, webhook_received
ERRORS: unhandled_exception (with stack trace)
```

---

## Backup Strategy

### PostgreSQL Automated Backup

```bash
#!/bin/bash
# /opt/trackma/scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/trackma/backups

mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U trackma trackma \
  | gzip > $BACKUP_DIR/trackma_$DATE.sql.gz

# Verify backup is not empty
if [ ! -s $BACKUP_DIR/trackma_$DATE.sql.gz ]; then
  echo "ERROR: Backup is empty!" >&2
  exit 1
fi

# Keep last 30 days
find $BACKUP_DIR -name "trackma_*.sql.gz" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR/trackma_$DATE.sql.gz"
```

```bash
# Cron: daily at 2:00 AM
0 2 * * * /opt/trackma/scripts/backup.sh >> /var/log/trackma-backup.log 2>&1
```

### Restore from Backup

```bash
gunzip -c /opt/trackma/backups/trackma_20260901_020000.sql.gz \
  | docker compose exec -T postgres psql -U trackma -d trackma
```

---

## Environment Promotion

```
local dev → Docker Compose dev → staging (VPS) → production (VPS)
```

| Environment | Branch | Domain | Notes |
|---|---|---|---|
| Local | any | localhost | Hot reload, synchronize:true |
| Staging | develop | staging.trackma.ma | CI auto-deploy on merge to develop |
| Production | main | trackma.ma | Manual deploy approval required |

---

## Dependency Management

```bash
# Check for outdated packages
pnpm outdated

# Check for security vulnerabilities
pnpm audit

# Update all packages to latest minor/patch
pnpm update

# Update a specific package
pnpm add @nestjs/common@latest --filter api
```

CI rule (Sprint 6): `pnpm audit --audit-level critical` — fail on critical vulnerabilities.

---

## Runbooks

### Service is down

```bash
# 1. Check Docker status
docker compose ps

# 2. Check logs for errors
docker compose logs --tail=100 <service>

# 3. Restart service
docker compose restart <service>

# 4. If postgres unhealthy, check disk space
df -h

# 5. If redis unhealthy, check memory
docker stats redis
```

### Database is corrupted

```bash
# 1. Stop the API (to prevent further writes)
docker compose stop api gps-ingestion

# 2. Restore latest backup
gunzip -c backups/latest.sql.gz | docker compose exec -T postgres psql -U trackma -d trackma

# 3. Restart services
docker compose start api gps-ingestion
```

### High MQTT message rate causing Redis backlog

```bash
# Check Redis memory usage
docker compose exec redis redis-cli INFO memory

# Check pub/sub subscriber count
docker compose exec redis redis-cli PUBSUB NUMSUB gps:position

# If GPS Ingestion is generating too many messages, check MQTT subscription
docker compose logs gps-ingestion | grep "Published position"
```
