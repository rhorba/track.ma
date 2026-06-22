# Architecture — TrackMa

## Overview

TrackMa uses a **Balanced Modular** architecture: two NestJS services (GPS Ingestion + Core API) communicate via Redis pub/sub, with a Next.js frontend consuming the Core API via REST and WebSocket.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GPS Device Layer                         │
│   Teltonika FMB / FMT   ──┐                                     │
│   Generic GPRS tracker  ──┤── MQTT (port 1883) ──► Mosquitto   │
│   Simulated device      ──┘                           Broker    │
└───────────────────────────────────────────────────────┬─────────┘
                                                        │ MQTT subscribe
                                           ┌────────────▼─────────────┐
                                           │   GPS Ingestion Service   │
                                           │   (NestJS — port 3002)    │
                                           │                           │
                                           │  • Subscribe MQTT topics  │
                                           │  • Parse Teltonika AVL    │
                                           │  • Parse generic JSON     │
                                           │  • Publish → Redis ch.    │
                                           └────────────┬─────────────┘
                                                        │ Redis pub/sub
                                                        │ channel: gps:position
                                           ┌────────────▼─────────────┐
                                           │    Core API Service       │
                                           │    (NestJS — port 3001)   │
                                           │                           │
                                           │  ┌─────────────────────┐ │
                                           │  │  REST API /api/*    │ │
                                           │  │  • auth             │ │
                                           │  │  • vehicles CRUD    │ │
                                           │  │  • alerts           │ │
                                           │  │  • trips            │ │
                                           │  │  • reports          │ │
                                           │  │  • billing (Stripe) │ │
                                           │  └─────────────────────┘ │
                                           │  ┌─────────────────────┐ │
                                           │  │  WebSocket /fleet   │ │
                                           │  │  • live positions   │ │
                                           │  │  • alert events     │ │
                                           │  └─────────────────────┘ │
                                           │  ┌─────────────────────┐ │
                                           │  │  Alert Engine       │ │
                                           │  │  • speeding check   │ │
                                           │  │  • geofence check   │ │
                                           │  │  • ignition events  │ │
                                           │  └─────────────────────┘ │
                                           └────┬──────────┬──────────┘
                                                │          │
                                     ┌──────────▼──┐  ┌───▼──────────┐
                                     │ PostgreSQL   │  │    Redis     │
                                     │             │  │              │
                                     │ • users      │  │ • latest pos │
                                     │ • orgs       │  │ • pub/sub    │
                                     │ • vehicles   │  │ • sessions   │
                                     │ • positions  │  └──────────────┘
                                     │ • trips      │
                                     │ • alerts     │
                                     │ • geofences  │
                                     └─────────────┘
                                                │ REST + WebSocket
                                     ┌──────────▼──────────────────┐
                                     │   Next.js Frontend           │
                                     │   (port 3000)                │
                                     │                              │
                                     │  • Public landing page       │
                                     │  • Auth (NextAuth + JWT)     │
                                     │  • Live map (Leaflet + OSM)  │
                                     │  • Vehicle management        │
                                     │  • Trip history & replay     │
                                     │  • Alert rules & history     │
                                     │  • Reports & CSV export      │
                                     │  • Billing / Stripe checkout │
                                     └──────────────────────────────┘
```

## Service Responsibilities

### GPS Ingestion Service (`apps/gps-ingestion`)

- **Single responsibility**: receive raw GPS telemetry, normalize it, publish to Redis.
- Stateless — no database access. Can be scaled horizontally independently.
- Subscribes to MQTT topics:
  - `trackma/devices/{imei}/position` — generic JSON format
  - `trackma/teltonika/{imei}` — Teltonika AVL binary-parsed-to-JSON
- Publishes normalized `GpsPosition` objects to Redis channel `gps:position`.
- Does NOT store data — the Core API handles persistence.

### Core API Service (`apps/api`)

- **Business logic hub**: auth, fleet management, alerts, billing.
- Subscribes to `gps:position` on Redis, stores positions in PostgreSQL, updates vehicle status, runs alert rules, publishes to WebSocket rooms.
- WebSocket gateway (`/fleet` namespace) — clients join `org:{orgId}` room and receive live position events.
- REST API under `/api` prefix with JWT protection on all private routes.

### Next.js Frontend (`apps/web`)

- Talks to Core API only (never directly to GPS Ingestion or Redis).
- NextAuth handles session management, wrapping the Core API's JWT.
- Leaflet + OpenStreetMap renders the live map — no external map API key needed.

### Shared Package (`packages/shared`)

- TypeScript interfaces shared between `api` and `gps-ingestion`:
  - `GpsPosition` — normalized telemetry event
  - `VehicleSummary`, `AlertEvent`, `JwtPayload`
  - `REDIS_CHANNELS` — channel name constants

## Data Flow: GPS Position

```
Device sends MQTT message
        │
        ▼
GPS Ingestion parses payload → GpsPosition
        │
        ▼
Redis PUBLISH gps:position { imei, lat, lng, speed, ... }
        │
        ▼
Core API Redis subscriber receives event
        │
        ├─► Lookup vehicle by IMEI
        ├─► Save Position to PostgreSQL
        ├─► Cache latest position in Redis (TTL 5 min)
        ├─► Update vehicle.status (active/idle/offline)
        ├─► Run alert rules engine
        │       ├─► Speeding? → create Alert + send email
        │       ├─► Geofence? → create Alert + send email
        │       └─► Ignition? → create Trip record
        └─► Broadcast via WebSocket to org room
                │
                ▼
        Browser receives 'position' event → marker moves on map
```

## Database Entity Relationships

```
Organization ─┬─< User (many users per org)
               └─< Vehicle (many vehicles per org)
                       │
                       ├─< Position (timeseries, indexed by vehicleId + timestamp)
                       ├─< Trip (start/end positions, distance, duration)
                       └─< AlertRule (rules scoped to org, optionally to vehicle)
                                │
                                └─< Alert (triggered events)

Organization ─< Geofence (polygon zones owned by org)
```

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Separate GPS ingestion | Yes | GPS devices send thousands of pings/min; business API has different scaling needs |
| Redis pub/sub (not Kafka/RabbitMQ) | Redis | Simpler ops, already in the stack for caching, sufficient for MVP throughput |
| TypeORM `synchronize: true` in dev | Yes | Faster dev iteration; migrations used in production |
| WebSocket namespace `/fleet` | socket.io | NestJS native support, room-based multicast fits org-scoped delivery |
| Leaflet + OSM | Yes | Zero API cost, Morocco tiles available, good performance |
| MQTT over TCP | Yes | Teltonika devices natively support MQTT; simpler than raw TCP parsing |
| monorepo (pnpm workspaces) | Yes | Shared types without publishing to npm; one `pnpm install` |
