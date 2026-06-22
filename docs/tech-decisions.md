# Technical Decisions (ADRs) — TrackMa

**Author**: Tech Lead  
**Format**: Architecture Decision Records (ADR)

---

## ADR-001 — Monorepo with pnpm Workspaces

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Project has 3 apps (API, GPS Ingestion, Web) and 1 shared types package. They need to share types without publishing to npm.

**Decision**: Use pnpm workspaces monorepo at the root level.

**Consequences**:
- ✅ Single `pnpm install` for all packages
- ✅ `@trackma/shared` importable as a local package with TypeScript path resolution
- ✅ One CI pipeline covers all apps
- ⚠️ Docker builds must copy the workspace root — Dockerfiles are slightly more complex

**Alternatives rejected**: Separate repos (too much overhead for solo dev), Turborepo (additional complexity not needed at this scale), nx (overkill for 3 apps).

---

## ADR-002 — NestJS for Both Backend Services

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Need a GPS Ingestion service and a Core API. Both are TypeScript.

**Decision**: Use NestJS for both, sharing the same framework knowledge.

**Consequences**:
- ✅ Consistent DI pattern, module system, decorators across both services
- ✅ Single developer needs to learn only one framework
- ✅ NestJS has native WebSocket (Socket.IO) and MQTT support
- ⚠️ GPS Ingestion is lightweight — NestJS is heavier than raw Node.js for this use case, but simplicity wins at MVP stage

---

## ADR-003 — Redis Pub/Sub for GPS Ingestion → Core API

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: GPS Ingestion and Core API are separate services and need to communicate. Options: REST HTTP, Redis pub/sub, RabbitMQ, Kafka.

**Decision**: Redis pub/sub.

**Consequences**:
- ✅ Redis is already in the stack for caching — no new dependency
- ✅ Pub/sub is exactly the right semantics (broadcast position to any number of API consumers)
- ✅ Simple: `redis.publish(channel, payload)` / `redis.subscribe(channel, callback)`
- ✅ Low latency (< 1ms on same Docker network)
- ⚠️ No persistence — if Core API is down when message arrives, it's lost. Acceptable for GPS (next position arrives in 30 seconds)
- ⚠️ Not suitable for ordered, guaranteed delivery — use RabbitMQ if this becomes a requirement (Sprint 6+ concern)

**Alternatives rejected**: Kafka (heavy, complex for MVP), RabbitMQ (extra service to operate), REST HTTP (introduces coupling and latency).

---

## ADR-004 — TypeORM with synchronize:true in Development

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Need a DB ORM. Options: TypeORM, Prisma, Drizzle.

**Decision**: TypeORM with `synchronize: true` in development, migration-based in production.

**Consequences**:
- ✅ NestJS-native integration (`@nestjs/typeorm`) — no extra setup
- ✅ `synchronize: true` = zero migration overhead during development sprint iterations
- ✅ Decorator-based entities stay co-located with domain code
- ⚠️ `synchronize: true` is dangerous in production — must be disabled (documented)
- ⚠️ TypeORM is more verbose than Prisma — compensated by developer familiarity

**Alternatives rejected**: Prisma (excellent DX but not NestJS-native, requires separate schema file), Drizzle (newer, less ecosystem).

---

## ADR-005 — Leaflet + OpenStreetMap (No Mapbox)

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Need a map library for the live GPS dashboard. Options: Mapbox GL JS, Google Maps, Leaflet + OSM, Here Maps.

**Decision**: Leaflet + OpenStreetMap.

**Consequences**:
- ✅ Zero cost — no API key, no per-load fees
- ✅ Morocco OSM coverage is adequate for fleet tracking
- ✅ Leaflet is the most-used open-source map library — extensive plugin ecosystem (Leaflet.draw for geofences)
- ✅ Leaflet.markercluster plugin available for large fleets
- ⚠️ OSM tiles are rate-limited for high-traffic sites — use a self-hosted tile server or tile CDN at scale
- ⚠️ Leaflet does not support vector tiles natively (less smooth than Mapbox GL) — acceptable for MVP

**Alternatives rejected**: Mapbox GL JS (costs money at scale, API key required), Google Maps (expensive at $7/1000 loads), HERE Maps (proprietary).

---

## ADR-006 — Socket.IO for WebSocket

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Need real-time position broadcasting from server to browser clients.

**Decision**: Socket.IO via `@nestjs/platform-socket.io`.

**Consequences**:
- ✅ NestJS native support via `@WebSocketGateway` decorator
- ✅ Room-based multicast fits org-scoped delivery perfectly (`org:{orgId}` rooms)
- ✅ Automatic reconnection and fallback to long-polling
- ✅ `socket.io-client` widely used on the frontend
- ⚠️ Socket.IO protocol overhead vs. raw WebSocket — negligible at MVP scale

---

## ADR-007 — bcrypt for Password Hashing

**Date**: 2026-06-22  
**Status**: Accepted

**Decision**: bcrypt with cost factor 12 for passwords, cost factor 10 for refresh tokens.

**Rationale**: bcrypt is the industry standard for password hashing — deliberately slow, widely audited. Cost 12 = ~250ms per hash on modern hardware (good for security, acceptable UX on register/login). Cost 10 for refresh tokens (more frequent rotation, lower security value).

**Alternatives rejected**: argon2 (better algorithm but requires native bindings — Docker compatibility issues), SHA-256 (too fast, vulnerable to brute force).

---

## ADR-008 — MQTT for GPS Device Communication

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: GPS devices need to send data to the server. Options: MQTT, raw TCP, HTTP POST, WebSocket.

**Decision**: MQTT via Mosquitto broker.

**Consequences**:
- ✅ Teltonika and most modern GPS devices support MQTT natively
- ✅ MQTT is designed for low-bandwidth, lossy networks (mobile GPRS) — QoS levels, retain, will
- ✅ Mosquitto is lightweight and production-proven
- ✅ Decouples device protocol from application — GPS Ingestion Service handles normalization
- ⚠️ Some legacy devices only support raw TCP binary — will need a TCP bridge (Sprint 3 contingency)

---

## ADR-009 — Docker Compose for Deployment

**Date**: 2026-06-22  
**Status**: Accepted

**Context**: Need a deployment strategy for the MVP.

**Decision**: Docker Compose on a single VPS for MVP.

**Consequences**:
- ✅ Simple ops — one file defines the entire stack
- ✅ Reproducible environments (dev = prod configuration)
- ✅ Easy to scale to basic multi-service deployment
- ✅ Cheap (one VPS ~240 MAD/month vs. managed Kubernetes ~2,000 MAD/month)
- ⚠️ Not horizontally scalable without moving to Kubernetes or Swarm — acceptable for < 500 tracked vehicles

**Migration path**: Docker Compose → Docker Swarm → Kubernetes as traffic grows. Services are already containerized so migration is straightforward.

---

## ADR-010 — Stripe for Payments

**Date**: 2026-06-22  
**Status**: Accepted

**Decision**: Stripe for subscription billing.

**Rationale**: Stripe supports MAD (Moroccan Dirham), has the best developer experience, and handles PCI compliance. The alternative (CMI — Crédit du Maroc Interbank) has a more complex integration with less documentation. Stripe's test cards make development faster.

**Risk**: Stripe Morocco payout restrictions (see Risk Register R03). Mitigation: verify eligibility in Sprint 4.
