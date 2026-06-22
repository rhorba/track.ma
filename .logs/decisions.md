# Decisions Log

---

## 2026-06-22 — Architecture & Stack

**Decision**: 🟡 BALANCED architecture
- GPS Ingestion Service (NestJS) — MQTT consumer → Redis pub/sub
- Core API Service (NestJS) — business logic, REST, WebSocket gateway, alerts engine
- Frontend (Next.js) — public site + dashboard
- PostgreSQL — all persistent data
- Redis — pub/sub pipeline + caching
- Mosquitto — MQTT broker for GPS devices
- Docker Compose — all services

**Decision**: Map provider → Leaflet + OpenStreetMap (free, no token)

**Rationale**: GPS ingestion has different scaling needs (device ping flood) vs business API (user requests). Redis pub/sub decouples them cleanly. Leaflet keeps costs zero.

