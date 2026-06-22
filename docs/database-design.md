# Database Design — TrackMa

**Author**: DBA (Database Administrator)  
**Date**: 2026-06-22

---

## Entity-Relationship Overview

```
Organization ──< User (many users per org)
Organization ──< Vehicle (many vehicles per org)
Vehicle ──< Position (many positions per vehicle)
Vehicle ──< Trip (many trips per vehicle)
Organization ──< AlertRule (rules belong to org, optionally scoped to vehicle)
AlertRule ──< Alert (alerts fired from rules)
Organization ──< Geofence (geofences belong to org)
```

---

## Schema Reference

### organizations

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | |
| name | varchar | NOT NULL | Company or individual name |
| tier | enum | NOT NULL, default 'trial' | trial/starter/pro/business |
| vehicleLimit | int | NOT NULL, default 2 | Enforced by API, not DB constraint |
| stripeCustomerId | varchar | nullable | Set when checkout initiated |
| stripeSubscriptionId | varchar | nullable | Set on subscription active |
| isActive | boolean | NOT NULL, default true | |
| createdAt | timestamptz | NOT NULL, default now() | |
| updatedAt | timestamptz | NOT NULL | |

### users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organizationId | uuid | FK → organizations.id, NOT NULL | |
| email | varchar | UNIQUE, NOT NULL | |
| name | varchar | NOT NULL | |
| passwordHash | varchar | NOT NULL, select: false | Never returned in queries |
| refreshTokenHash | varchar | nullable, select: false | Null after logout |
| role | enum | NOT NULL, default 'viewer' | org_admin/fleet_manager/viewer/driver |
| isActive | boolean | NOT NULL, default true | |
| createdAt | timestamptz | NOT NULL | |
| updatedAt | timestamptz | NOT NULL | |

### vehicles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organizationId | uuid | FK → organizations.id, NOT NULL | |
| name | varchar | NOT NULL | Display name |
| licensePlate | varchar | NOT NULL | |
| type | enum | NOT NULL | car/truck/motorcycle/van |
| imei | varchar | UNIQUE, nullable | Null = no device linked |
| status | enum | NOT NULL, default 'offline' | active/idle/offline |
| fuelConsumptionRate | decimal(5,2) | NOT NULL, default 8.0 | L/100km, fallback calc |
| isActive | boolean | NOT NULL, default true | Soft delete |
| createdAt | timestamptz | NOT NULL | |
| updatedAt | timestamptz | NOT NULL | |

**Index**: `UNIQUE (imei) WHERE imei IS NOT NULL` — partial unique index prevents duplicate IMEIs while allowing multiple null IMEIs.

### positions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| vehicleId | uuid | NOT NULL | No FK constraint — insert bottleneck at high rate |
| lat | decimal(10,7) | NOT NULL | WGS84 latitude |
| lng | decimal(10,7) | NOT NULL | WGS84 longitude |
| speed | decimal(6,2) | NOT NULL | km/h |
| heading | smallint | NOT NULL | 0-359 degrees |
| altitude | int | NOT NULL | meters |
| satellites | smallint | NOT NULL | GPS satellite count |
| ignition | boolean | NOT NULL | |
| fuelLevel | smallint | nullable | % (from device, or null) |
| odometer | int | nullable | km |
| timestamp | timestamptz | NOT NULL | Device timestamp, not server |

**Index**: `CREATE INDEX idx_positions_vehicle_time ON positions (vehicleId, timestamp DESC)` — covers the primary query pattern: `WHERE vehicleId = $1 ORDER BY timestamp DESC LIMIT 100`.

**Partitioning plan (Phase 2)**: Partition by month using `PARTITION BY RANGE (timestamp)`. Monthly partitions allow dropping old data without locking the whole table.

**Note**: No FK on vehicleId intentionally — at high GPS ingestion rates (many inserts/sec), a FK check adds ~10% overhead. Vehicle existence is validated in the application layer.

### trips

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| vehicleId | uuid | FK → vehicles.id, NOT NULL | |
| startedAt | timestamptz | NOT NULL | |
| endedAt | timestamptz | nullable | Null = trip in progress |
| startLat | decimal(10,7) | NOT NULL | |
| startLng | decimal(10,7) | NOT NULL | |
| endLat | decimal(10,7) | nullable | |
| endLng | decimal(10,7) | nullable | |
| distanceKm | decimal(8,2) | nullable | Calculated on trip close |
| durationSeconds | int | nullable | |
| avgSpeedKmh | decimal(6,2) | nullable | |
| fuelConsumedL | decimal(6,2) | nullable | |
| isComplete | boolean | NOT NULL, default false | |

**Index**: `CREATE INDEX idx_trips_vehicle_started ON trips (vehicleId, startedAt DESC)`.

### alert_rules

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organizationId | uuid | FK → organizations.id, NOT NULL | |
| vehicleId | uuid | nullable | Null = applies to all org vehicles |
| type | enum | NOT NULL | speeding/ignition_on/ignition_off/low_fuel/geofence_exit/geofence_enter |
| config | jsonb | NOT NULL | Type-specific config (e.g., `{"speedLimit": 120}`) |
| notifyByEmail | boolean | NOT NULL, default true | |
| isActive | boolean | NOT NULL, default true | |
| createdAt | timestamptz | NOT NULL | |

**Config schema by type**:
```json
speeding:     { "speedLimit": 120 }
low_fuel:     { "fuelThreshold": 15 }
geofence:     { "geofenceId": "uuid" }
ignition_on/off: {}
```

### alerts

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| alertRuleId | uuid | FK → alert_rules.id, NOT NULL | |
| vehicleId | uuid | FK → vehicles.id, NOT NULL | |
| type | enum | NOT NULL | Denormalized from rule for faster queries |
| severity | enum | NOT NULL, default 'medium' | low/medium/high/critical |
| value | varchar | nullable | The triggering value ("145 km/h") |
| acknowledgedAt | timestamptz | nullable | Null = unacknowledged |
| acknowledgedBy | uuid | nullable | userId |
| triggeredAt | timestamptz | NOT NULL | |

**Index**: `CREATE INDEX idx_alerts_vehicle_triggered ON alerts (vehicleId, triggeredAt DESC)`.
**Index**: `CREATE INDEX idx_alerts_org_unacked ON alerts (organizationId, acknowledgedAt) WHERE acknowledgedAt IS NULL` — fast unread alerts count query.

### geofences

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK | |
| organizationId | uuid | FK → organizations.id, NOT NULL | |
| name | varchar | NOT NULL | |
| polygon | jsonb | NOT NULL | Array of `{lat, lng}` objects |
| isActive | boolean | NOT NULL, default true | |
| createdAt | timestamptz | NOT NULL | |

---

## Query Patterns (Top 5 by frequency)

### 1. Latest position for all org vehicles (dashboard load)

```sql
SELECT v.id, v.name, v.licensePlate, v.status,
       p.lat, p.lng, p.speed, p.ignition, p.timestamp
FROM vehicles v
LEFT JOIN LATERAL (
  SELECT lat, lng, speed, ignition, timestamp
  FROM positions
  WHERE vehicleId = v.id
  ORDER BY timestamp DESC
  LIMIT 1
) p ON true
WHERE v.organizationId = $1 AND v.isActive = true;
```

**Performance**: LATERAL join with index on `(vehicleId, timestamp DESC)` = O(N) where N = number of active vehicles. Fast.

### 2. Vehicle trip history

```sql
SELECT id, startedAt, endedAt, distanceKm, durationSeconds, fuelConsumedL
FROM trips
WHERE vehicleId = $1 AND isComplete = true
ORDER BY startedAt DESC
LIMIT 50;
```

**Performance**: Index on `(vehicleId, startedAt DESC)` covers this.

### 3. Unacknowledged alerts for org

```sql
SELECT a.*, v.name as vehicleName
FROM alerts a
JOIN vehicles v ON v.id = a.vehicleId
WHERE v.organizationId = $1 AND a.acknowledgedAt IS NULL
ORDER BY a.triggeredAt DESC;
```

### 4. Trip route positions

```sql
SELECT lat, lng, speed, heading, timestamp
FROM positions
WHERE vehicleId = $1 AND timestamp BETWEEN $2 AND $3
ORDER BY timestamp ASC;
```

### 5. Fleet summary for reports

```sql
SELECT
  COUNT(DISTINCT t.id) as totalTrips,
  SUM(t.distanceKm) as totalKm,
  SUM(t.fuelConsumedL) as totalFuel,
  AVG(t.avgSpeedKmh) as avgSpeed
FROM trips t
JOIN vehicles v ON v.id = t.vehicleId
WHERE v.organizationId = $1 AND t.startedAt BETWEEN $2 AND $3 AND t.isComplete = true;
```

---

## Migration Strategy

### Development

`synchronize: true` — TypeORM auto-migrates. No manual migration files needed.

### Production (Sprint 6)

```bash
# Generate migration after entity changes
pnpm --filter api typeorm migration:generate src/migrations/MigrationName

# Run pending migrations
pnpm --filter api typeorm migration:run

# Rollback last migration
pnpm --filter api typeorm migration:revert
```

Production TypeORM config:
```typescript
synchronize: false,
migrationsRun: true,
migrations: [__dirname + '/migrations/**/*.js'],
```

---

## Performance Monitoring

Key queries to EXPLAIN ANALYZE monthly:

```sql
EXPLAIN ANALYZE SELECT ... (dashboard query)
EXPLAIN ANALYZE SELECT ... (trip history query)
EXPLAIN ANALYZE SELECT ... (unacked alerts query)
```

Alert thresholds:
- Sequential scan on `positions` > 10k rows → add index
- Query time > 100ms → optimize

---

## Seed Data (Development)

```bash
# Seed a demo org with vehicles and positions
pnpm --filter api run seed

# Seed creates:
# - 1 org "Demo Company"
# - 1 admin user (demo@trackma.ma / password: demo1234)
# - 5 vehicles
# - 1000 positions per vehicle (last 24h, random routes in Casablanca)
# - 3 closed trips per vehicle
# - 2 alert rules (speeding + ignition_off)
```
