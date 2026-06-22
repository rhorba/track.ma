# TrackMa Documentation Index

All specialist documentation for the TrackMa GPS Fleet Management SaaS project.

---

## Project Management

| Document | Specialist | Description |
|---|---|---|
| [project-charter.md](project-charter.md) | PM | Business case, goals, scope, budget, timeline |
| [risk-register.md](risk-register.md) | PM | 7 identified risks with mitigation |
| [product-roadmap.md](product-roadmap.md) | PM | 3-phase roadmap, competitive positioning |

## Agile / Scrum

| Document | Specialist | Description |
|---|---|---|
| [sprints/sprint-backlog.md](sprints/sprint-backlog.md) | Scrum Master | Full 6-sprint backlog with user stories + acceptance criteria |

## Architecture & Design

| Document | Specialist | Description |
|---|---|---|
| [system-design.md](system-design.md) | System Designer | Component diagram, data flows, NFRs, scalability path |
| [tech-decisions.md](tech-decisions.md) | Tech Lead | ADR-001 through ADR-010, all major technology choices |
| [database-design.md](database-design.md) | DBA | Schema reference, query patterns, migration strategy |

## Security

| Document | Specialist | Description |
|---|---|---|
| [security-review.md](security-review.md) | Security Engineer | Threat model, OWASP Top 10 assessment, MQTT security |

## UX / UI

| Document | Specialist | Description |
|---|---|---|
| [ux-design.md](ux-design.md) | UX Designer | Personas, information architecture, user flows, wireframes |
| [design-system.md](design-system.md) | UI Designer | Color tokens, typography, component inventory, RTL guide |

## Development

| Document | Specialist | Description |
|---|---|---|
| [backend-guide.md](backend-guide.md) | Backend Developer | API conventions, service patterns, auth, Redis usage |
| [frontend-guide.md](frontend-guide.md) | Frontend Developer | Next.js patterns, Leaflet integration, WebSocket, RTL |

## Quality

| Document | Specialist | Description |
|---|---|---|
| [test-strategy.md](test-strategy.md) | Test Architect | Testing pyramid, unit/integration/E2E strategy, coverage gate |

## DevOps

| Document | Specialist | Description |
|---|---|---|
| [devops-guide.md](devops-guide.md) | DevOps | CI/CD pipeline, Docker operations, logging, backup, runbooks |

## Marketing

| Document | Specialist | Description |
|---|---|---|
| [marketing/launch-plan.md](marketing/launch-plan.md) | Digital Marketer | GTM strategy, SEO, launch phases, KPIs, budget |
| [marketing/landing-page-copy.md](marketing/landing-page-copy.md) | Copywriter | Hero, features, pricing, FAQ, email sequences |
| [marketing/content-strategy.md](marketing/content-strategy.md) | Content Marketer | Blog calendar, LinkedIn cadence, WhatsApp strategy |

## Operations

| Document | Specialist | Description |
|---|---|---|
| [project-monitor.md](project-monitor.md) | Project Monitor | KPI definitions, sprint health template, monthly report template |

---

## Quick Reference

**Monorepo structure**:
- `apps/api` — NestJS Core API (port 3001)
- `apps/gps-ingestion` — NestJS GPS Ingestion (port 3002)
- `apps/web` — Next.js 15 frontend (port 3000)
- `packages/shared` — Shared TypeScript types

**6 Docker services**: postgres, redis, mosquitto, api, gps-ingestion, web

**Sprint timeline** (3 months):
- Sprint 1: 2026-06-22 → 2026-07-06 ✅ Foundation
- Sprint 2: 2026-07-07 → 2026-07-20 — GPS Pipeline & Live Map
- Sprint 3: 2026-07-21 → 2026-08-03 — Alerts & Trip History
- Sprint 4: 2026-08-04 → 2026-08-17 — Fuel, Roles & Reports
- Sprint 5: 2026-08-18 → 2026-08-31 — Billing & Public Site
- Sprint 6: 2026-09-01 → 2026-09-14 — Security, Polish & Launch
