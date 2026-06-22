# Database Documentation — TrackMa

**Engine**: PostgreSQL 16  
**ORM**: TypeORM (NestJS)  
**Schema management**: `synchronize: true` in development, manual migrations in production

---

## Entity Relationship Overview

```
┌──────────────────┐         ┌──────────────────┐
│   organizations  │─────────│      users        │
│──────────────────│  1:many │──────────────────│
│ id (uuid, PK)    │         │ id (uuid, PK)     │
│ name             │         │ name              │
│ slug             │         │ email (unique)    │
│ tier             │         │ passwordHash      │
│ subscriptionStatus│        │ role              │
│ stripeCustomerId │         │ isActive          │
│ stripeSubscriptionId│      │ refreshTokenHash  │
│ vehicleLimit     │         │ organization_id   │
│ createdAt        │         │ createdAt         │
│ updatedAt        │         └──────────────────┘
└────────┬─────────┘
         │ 1:many
         ▼
┌──────────────────┐         ┌──────────────────┐
│    vehicles      │─────────│    positions      │
│──────────────────│  1:many │──────────────────│
│ id (uuid, PK)    │         │ id (uuid, PK)     │
│ name             │         │ vehicle_id (FK)   │
│ plate            │         │ lat               │
│ type             │         │ lng               │
│ status           │         │ speed             │
│ imei (unique)    │         │ heading           │
│ driverName       │         │ altitude          │
│ fuelConsumption  │         │ satellites        │
│ isActive         │         │ ignition          │
│ organization_id  │         │ fuelLevel         │
│ createdAt        │         │ odometer          │
│ updatedAt        │         │ timestamp (idx)   │
└────────┬─────────┘         │ createdAt         │
         │                   └──────────────────┘
         │ 1:many
         ▼
┌──────────────────┐
│      trips       │
│──────────────────│
│ id (uuid, PK)    │
│ vehicle_id (FK)  │
│ startedAt        │
│ endedAt          │
│ startLat/Lng     │
│ endLat/Lng       │
│ distanceKm       │
│ durationSeconds  │
│ maxSpeedKmh      │
│ avgSpeedKmh      │
│ fuelConsumedL    │
│ isComplete       │
└──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   alert_rules    │─────────│     alerts        │
│──────────────────│  1:many │──────────────────│
│ id (uuid, PK)    │         │ id (uuid, PK)     │
│ name             │         │ vehicle_id (FK)   │
│ type             │         │ rule_id (FK)      │
│ config (jsonb)   │         │ type              │
│ isActive         │         │ severity          │
│ notifyByEmail    │         │ message           │
│ organization_id  │         │ data (jsonb)      │
│ vehicle_id (opt) │         │ acknowledged      │
│ createdAt        │         │ acknowledgedAt    │
└──────────────────┘         │ triggeredAt       │
                             └──────────────────┘

┌──────────────────┐
│    geofences     │
│──────────────────│
│ id (uuid, PK)    │
│ name             │
│ polygon (jsonb)  │
│ isActive         │
│ organization_id  │
│ createdAt        │
└──────────────────┘
```

---

## Table Details

### `organizations`

The root multi-tenant unit. Each organization has a `vehicleLimit` enforced by the billing tier.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | varchar | Display name |
| `slug` | varchar | URL-safe unique identifier |
| `tier` | enum | `trial` / `starter` / `pro` / `business` |
| `subscription_status` | enum | `trialing` / `active` / `past_due` / `cancelled` |
| `stripe_customer_id` | varchar | Stripe customer ID |
| `stripe_subscription_id` | varchar | Stripe subscription ID |
| `vehicle_limit` | int | Max vehicles allowed (2 for trial) |

**Tier → vehicle limit mapping**:
| Tier | Limit |
|---|---|
| trial | 2 |
| starter | 5 |
| pro | 25 |
| business | unlimited (9999) |

---

### `users`

Belongs to one organization. `passwordHash` is excluded from default queries (select: false).

| Column | Type | Notes |
|---|---|---|
| `role` | enum | `org_admin` / `fleet_manager` / `viewer` / `driver` |
| `password_hash` | varchar | bcrypt hash (cost 12) |
| `refresh_token_hash` | varchar | bcrypt hash of latest refresh token; null = logged out |

**Role permissions**:
| Role | View fleet | Manage vehicles | Manage alerts | Manage users | Billing |
|---|---|---|---|---|---|
| `org_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `fleet_manager` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `viewer` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `driver` | own vehicle only | ❌ | ❌ | ❌ | ❌ |

---

### `vehicles`

Each vehicle has a unique `imei` that links it to GPS device messages.

| Column | Type | Notes |
|---|---|---|
| `imei` | varchar(15) | Unique, nullable (vehicle registered before device) |
| `status` | enum | `active` / `idle` / `offline` / `maintenance` — updated on every position event |
| `fuel_consumption_rate` | float | L/100km, used when device doesn't report fuel level |

---

### `positions`

High-volume timeseries table. Key indexes:

```sql
-- Composite index for vehicle history queries
CREATE INDEX idx_positions_vehicle_timestamp ON positions (vehicle_id, timestamp DESC);

-- Index for time-range queries
CREATE INDEX idx_positions_timestamp ON positions (timestamp DESC);
```

**Retention policy** (Sprint 6): positions older than 12 months will be partitioned/archived.

---

### `trips`

Automatically created by the alert engine when ignition turns on; completed when ignition turns off. `isComplete = false` means the trip is in progress.

---

### `alert_rules`

The `config` jsonb column stores rule-specific parameters:

| Rule type | Config example |
|---|---|
| `speeding` | `{ "speedLimit": 120 }` |
| `geofence_enter` | `{ "geofenceId": "uuid" }` |
| `geofence_exit` | `{ "geofenceId": "uuid" }` |
| `ignition_on` | `{}` |
| `ignition_off` | `{}` |
| `low_fuel` | `{ "fuelThreshold": 15 }` |
| `offline` | `{ "offlineMinutes": 30 }` |

`vehicle_id` null = rule applies to all vehicles in org.

---

### `geofences`

The `polygon` jsonb stores an array of lat/lng points defining a closed polygon:

```json
[
  { "lat": 33.5731, "lng": -7.5898 },
  { "lat": 33.5800, "lng": -7.5898 },
  { "lat": 33.5800, "lng": -7.5800 },
  { "lat": 33.5731, "lng": -7.5800 }
]
```

Point-in-polygon check uses the ray casting algorithm in the Alert Engine.

---

## Indexes

Beyond the primary key indexes, these are created:

```sql
-- Positions: fast vehicle history
CREATE INDEX idx_positions_vehicle_timestamp ON positions (vehicle_id, timestamp);

-- Vehicles: IMEI lookup on every GPS message
CREATE INDEX idx_vehicles_imei ON vehicles (imei);

-- Alerts: org-scoped queries via alert_rules join
CREATE INDEX idx_alert_rules_org ON alert_rules (organization_id);

-- Users: login lookup
CREATE INDEX idx_users_email ON users (email);
```

---

## Production Migrations

In production, disable `synchronize` in `app.module.ts` and use TypeORM migrations:

```bash
# Generate a migration after changing entities
pnpm --filter api run migration:generate -- src/migrations/AddFuelLevel

# Run pending migrations
pnpm --filter api run migration:run

# Revert last migration
pnpm --filter api run migration:revert
```

Add these scripts to `apps/api/package.json`:

```json
"migration:generate": "typeorm migration:generate -d src/data-source.ts",
"migration:run": "typeorm migration:run -d src/data-source.ts",
"migration:revert": "typeorm migration:revert -d src/data-source.ts"
```
