# System Design — TrackMa

**Author**: System Designer + Software Architect  
**Date**: 2026-06-22  
**Status**: Approved

---

## 1. Non-Functional Requirements (NFRs)

| Category | Requirement | Target |
|---|---|---|
| **Availability** | API uptime | ≥ 99.5% (< 44h downtime/year) |
| **Latency** | GPS position → browser map update | < 2 seconds |
| **Throughput** | Simultaneous vehicles tracked | 500 (MVP), 5,000 (Phase 2) |
| **Scalability** | New service instances | Horizontal via Docker Compose scaling |
| **Data retention** | GPS positions | 12 months online, archived after |
| **Security** | Auth token lifetime | Access: 15min, Refresh: 7 days |
| **Security** | Password hashing | bcrypt, cost factor 12 |
| **Security** | Data in transit | HTTPS/TLS 1.2+ enforced |
| **Observability** | Error logging | Structured logs to stdout (Docker captures) |
| **Recovery** | DB backup | Daily automated backup, 30-day retention |

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    External Layer                        │
│  GPS Devices (Teltonika FMB, generic GPRS trackers)     │
│  User Browsers (Chrome, Firefox, Safari Mobile)         │
│  Stripe (payment webhooks)                              │
└──────────┬──────────────────────────┬───────────────────┘
           │ MQTT (1883)              │ HTTPS (443)
           ▼                          ▼
┌──────────────────┐       ┌──────────────────────────────┐
│ Mosquitto Broker │       │      Nginx Reverse Proxy     │
│ (MQTT v3.1.1)    │       │  /        → Next.js :3000    │
│ Port 1883 / 9001 │       │  /api     → NestJS API :3001 │
└────────┬─────────┘       │  /fleet   → WS API :3001     │
         │                 └──────────────┬───────────────┘
         ▼                                │
┌─────────────────┐            ┌──────────▼───────────────┐
│ GPS Ingestion   │            │     Next.js Frontend     │
│ NestJS :3002    │            │     :3000                │
│                 │            │  App Router, NextAuth    │
│ • MQTT client   │            │  Leaflet + OSM           │
│ • Teltonika     │            │  Socket.IO client        │
│   parser        │            │  FR/AR (next-intl)       │
│ • Generic JSON  │            └──────────────────────────┘
│   parser        │
└────────┬────────┘
         │ Redis Pub/Sub (gps:position)
         ▼
┌─────────────────────────────────────────────────────────┐
│                  NestJS Core API :3001                  │
│                                                         │
│  AuthModule      UsersModule      OrgsModule            │
│  VehiclesModule  FleetModule      AlertsModule          │
│  TripsModule     ReportsModule    BillingModule         │
│  MailModule      RedisModule                            │
│                                                         │
│  WebSocket Gateway (/fleet namespace)                   │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────┐       ┌─────────────────────────────┐
│   PostgreSQL    │       │           Redis             │
│   :5432         │       │           :6379             │
│                 │       │                             │
│  All entities   │       │  vehicle:{id}:latest (pos)  │
│  Timeseries     │       │  Pub/Sub channel            │
│  positions      │       │  Session cache              │
└─────────────────┘       └─────────────────────────────┘
```

---

## 3. Data Flow Specifications

### 3.1 GPS Position Ingestion Flow

```
1. Device sends MQTT message to Mosquitto on topic:
   trackma/devices/{imei}/position  OR  trackma/teltonika/{imei}

2. GPS Ingestion Service (MqttIngestionService.handleMessage):
   a. Extract IMEI from topic
   b. Parse payload based on topic type (generic JSON or Teltonika)
   c. Map to GpsPosition interface
   d. Call redis.publish('gps:position', JSON.stringify(gpsPosition))

3. Core API (FleetGateway Redis subscriber):
   a. Receive message from gps:position channel
   b. Look up vehicle by IMEI in PostgreSQL
   c. If no vehicle found → drop silently
   d. Create and save Position record in PostgreSQL
   e. Update vehicle.status in PostgreSQL
   f. Set Redis key vehicle:{vehicleId}:latest (TTL 300s)
   g. Run alert rules engine synchronously
   h. Emit 'position' event to Socket.IO room org:{orgId}

4. Browser:
   a. Socket.IO client receives 'position' event
   b. Update Leaflet marker for vehicleId
   c. Update sidebar vehicle status
```

### 3.2 Alert Engine Flow

```
On each GpsPosition event received by Core API:

1. Fetch all active AlertRules for the org (cached per org, 60s TTL)
2. For each rule:
   a. SPEEDING: if position.speed > rule.config.speedLimit → trigger
   b. IGNITION_ON: if position.ignition && prev_ignition was false → trigger
   c. IGNITION_OFF: if !position.ignition && prev_ignition was true → trigger
   d. LOW_FUEL: if position.fuelLevel < rule.config.fuelThreshold → trigger
   e. GEOFENCE_EXIT: if prev_position was inside polygon && current is outside → trigger
3. For each triggered rule:
   a. Check dedup: if Alert exists for same rule+vehicle in last 5 min → skip
   b. Create Alert record in PostgreSQL
   c. If rule.notifyByEmail: send email via MailService (non-blocking)
   d. Publish alert event to Redis (for WebSocket broadcast to dashboard)
```

### 3.3 Trip Detection Flow

```
On each GpsPosition event:

1. Fetch current active trip for vehicle (isComplete=false)
2. If ignition=true AND no active trip:
   → Create new Trip { vehicleId, startedAt: now, startLat, startLng, isComplete: false }
3. If ignition=false AND active trip exists:
   → Close trip:
     - endedAt = now
     - endLat, endLng = current position
     - durationSeconds = endedAt - startedAt
     - distanceKm = sum of Haversine distances between consecutive positions
     - avgSpeedKmh = distanceKm / (durationSeconds / 3600)
     - fuelConsumedL = vehicle.fuelConsumptionRate * distanceKm / 100 (if no device fuel)
     - isComplete = true
```

---

## 4. API Design Principles

- **REST**: Resource-oriented URLs, HTTP verbs (GET/POST/PATCH/DELETE)
- **Auth**: JWT Bearer token, 15-minute access token, 7-day refresh token
- **Validation**: `class-validator` on all DTOs, `whitelist: true` strips unknown fields
- **Errors**: Consistent `{ statusCode, message, error }` format
- **Rate limiting**: 100 req/min per IP via `@nestjs/throttler`
- **Prefixing**: All routes under `/api` prefix
- **CORS**: Only `APP_URL` origin allowed in production
- **Organization isolation**: All queries filter by `organizationId` from JWT payload

---

## 5. Database Design Decisions

### Why UUID primary keys?
- No sequential ID leakage (attacker can't enumerate `GET /vehicles/1`, `/vehicles/2`)
- Safe to expose in URLs and API responses
- No insert ordering dependency

### Why `synchronize: true` in development?
- Fastest iteration — schema stays in sync with entity changes automatically
- Never use in production (risk of data loss on column drops)

### Why soft deletes (isActive = false)?
- Maintains referential integrity with positions, trips, alerts
- Allows data recovery if accidentally deleted
- Consistent with how billing history references vehicles

### Why jsonb for alert config and geofence polygon?
- Alert rule config varies per type — jsonb avoids a polymorphic table mess
- Geofence polygons are variable-length arrays — jsonb is simpler than a separate points table for MVP

### Positions table — no foreign key on vehicle_id index?
- PostgreSQL index on `vehicle_id, timestamp` covers the query pattern
- FK constraint would be an insert bottleneck at high GPS ingestion rates
- Vehicle existence is validated in the ingestion flow, not at DB level

---

## 6. Security Architecture

### Authentication Flow

```
1. POST /api/auth/login → validates credentials → returns { accessToken (15min), refreshToken (7d) }
2. All protected requests: Authorization: Bearer <accessToken>
3. JwtStrategy validates token, loads user from DB (checks isActive)
4. On 401 (expired token): POST /api/auth/refresh with refreshToken → new token pair
5. On logout: refresh token hash cleared from DB → cannot refresh
```

### Authorization (RBAC)

```
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('org_admin', 'fleet_manager')
```

Roles are embedded in the JWT payload — no DB lookup on every request for role checks.

### Secrets Management

- All secrets in `.env` (gitignored), never hardcoded
- `.env.example` contains only placeholder values
- In production: use Docker secrets or environment injection via CI/CD

---

## 7. Scalability Path

### MVP (current)

- Single Docker Compose on 1 VPS
- All services on same host
- Sufficient for ~500 tracked vehicles

### Phase 2 (5,000 vehicles)

- Scale GPS Ingestion horizontally (stateless service, add replicas)
- Add Redis Cluster if pub/sub throughput becomes a bottleneck
- Partition `positions` table by month (PostgreSQL partitioning or TimescaleDB)

### Phase 3 (50,000+ vehicles)

- Move to Kubernetes
- Separate DB read replicas for analytics queries
- Consider ClickHouse for time-series analytics
- CDN for static Next.js assets
