# TrackMa — GPS Fleet Management Platform

TrackMa is a self-serve, real-time GPS fleet management SaaS built for the Moroccan market. It serves both professional fleet operators (cars, trucks, boats) and individual vehicle owners, with transparent pricing, instant onboarding, and a modern bilingual (FR/AR) interface.

## Features

- **Live GPS Map** — Real-time vehicle positions on OpenStreetMap via WebSocket
- **Trip History & Replay** — Full trip records with animated map replay
- **Smart Alerts** — Speeding, geofence breach, ignition events, low fuel — with email notifications
- **Fuel Monitoring** — Device-reported or distance-calculated fuel consumption
- **Multi-user Organizations** — Roles: Admin, Fleet Manager, Viewer, Driver
- **Self-serve Billing** — Stripe-powered subscription tiers (Starter / Pro / Business)
- **GPS Device Support** — Teltonika AVL protocol + generic MQTT JSON
- **Bilingual UI** — French and Arabic (next-intl)

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

| Sprint | Weeks | Goal |
|---|---|---|
| ✅ Sprint 1 | 1–2 | Foundation & Scaffold |
| Sprint 2 | 3–4 | GPS Pipeline & Live Map |
| Sprint 3 | 5–6 | Alerts & Trip History |
| Sprint 4 | 7–8 | Fuel, Roles & Reports |
| Sprint 5 | 9–10 | Billing & Public Site |
| Sprint 6 | 11–12 | Security, Polish & Launch |

## License

MIT
