# TrackMa — GPS Fleet Management Platform

TrackMa is a self-serve, real-time GPS fleet management SaaS built for the Moroccan market. It serves both professional fleet operators (cars, trucks, boats) and individual vehicle owners, with transparent pricing, instant onboarding, and a modern bilingual (FR/AR) interface.

## Features

- **Live GPS Map** — Real-time vehicle positions on OpenStreetMap via WebSocket
- **Trip History & Replay** — Full trip records with animated map replay
- **Smart Alerts** — Speeding, geofence breach, ignition events, low fuel — with email notifications
- **Fuel Monitoring** — Device-reported or distance-calculated fuel consumption
- **Multi-user Organizations** — Roles: Admin, Fleet Manager, Viewer, Driver
- **Self-serve Billing** — Stripe-powered subscription tiers (Starter / Pro / Business / Flotte+)
- **GPS Device Support** — Teltonika AVL protocol + generic MQTT JSON
- **Bilingual UI** — French and Arabic with RTL support (next-intl)
- **Multi-tenant Branding** — Per-organisation slug routing and brand colour customisation
- **Analytics Dashboard** — SVG charts for fleet KPIs and usage metrics
- **PWA** — Progressive Web App with offline support
- **Demo Mode** — Public sandbox with pre-seeded data, no sign-up required
- **SEO & CDN Optimisation** — SSG landing pages, edge caching, structured data
- **Load Tested** — k6 scripts validate performance under production-scale traffic

## Architecture

```
[GPS Devices / Teltonika] ──MQTT──► [GPS Ingestion Service]
                                           │ Redis pub/sub
                                    [Core API Service] ──WS──► [Browser Dashboard]
                                           │
                                    PostgreSQL + Redis
                                           │
                                    [Next.js Frontend] ──REST──► [Core API Service]
```

See [docs/architecture.md](docs/architecture.md) for the full system design.

## Quick Start

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) — `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone & Install

```bash
git clone https://github.com/rhorba/track.ma.git
cd track.ma
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values — see docs/development.md for details
```

### 3. Start All Services

```bash
# Start infrastructure (postgres, redis, mosquitto) + all apps
docker compose up -d

# Or run services locally (infrastructure via Docker, apps via pnpm)
docker compose up -d postgres redis mosquitto
pnpm dev
```

### 4. Open the App

| Service | URL |
|---|---|
| Web Dashboard | http://localhost:3000 |
| API | http://localhost:3001/api |
| GPS Ingestion | http://localhost:3002 |

## Project Structure

```
track.ma/
├── apps/
│   ├── api/              NestJS Core API (REST + WebSocket)
│   ├── gps-ingestion/    NestJS GPS Ingestion (MQTT → Redis)
│   └── web/              Next.js 15 App Router frontend
├── packages/
│   └── shared/           Shared TypeScript types and constants
├── infra/
│   └── mosquitto/        MQTT broker configuration
├── docs/                 Full project documentation
├── .github/workflows/    CI/CD pipeline
├── docker-compose.yml    Local development stack
└── .env.example          Environment variable template
```

## Documentation

| Doc | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, component boundaries |
| [Development](docs/development.md) | Local setup, debugging, dev workflow |
| [API Reference](docs/api-reference.md) | All REST endpoints with examples |
| [GPS Integration](docs/gps-integration.md) | Connecting GPS devices (Teltonika, generic MQTT) |
| [Database](docs/database.md) | Entity relationships and schema guide |
| [Deployment](docs/deployment.md) | Docker production setup |
| [Stripe Setup](docs/stripe-setup.md) | Billing configuration and webhook setup |

## Development

```bash
pnpm dev          # Start all apps in watch mode (parallel)
pnpm test         # Run all tests
pnpm test:cov     # Run tests with coverage report
pnpm lint         # Lint all packages
pnpm build        # Build all packages
```

## Sprint Roadmap

> **Project status: COMPLETE** — all 7 sprints shipped, CI green, 34/34 E2E tests passing.

| Sprint | Goal | Status |
|---|---|---|
| Sprint 1 | Foundation & Scaffold — monorepo, Docker, CI skeleton | ✅ Done |
| Sprint 2 | GPS Pipeline & Live Map — MQTT ingestion, WebSocket, OpenStreetMap | ✅ Done |
| Sprint 3 | Alerts & Trip History — geofence, speeding, email notifications, replay | ✅ Done |
| Sprint 4 | Billing, Roles & Admin — Stripe, invite flow, onboarding, admin panel | ✅ Done |
| Sprint 5 | GPS Hardening & CI — production Dockerfiles, quality gates, Playwright E2E smoke tests | ✅ Done |
| Sprint 6 | Security, Landing & French UI — hardening, demo mode, DB indexes, 134 tests | ✅ Done |
| Sprint 7 | Scale & Polish — k6 load tests, SEO/CDN, multi-tenant branding, Arabic RTL, PWA, analytics | ✅ Done |

## License

MIT
