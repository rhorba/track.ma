# Project Charter — TrackMa

**Version**: 1.0  
**Date**: 2026-06-22  
**Project Manager**: Mohamed Rhorba  
**Status**: Active

---

## 1. Project Overview

TrackMa is a self-serve GPS fleet management SaaS platform targeting the Moroccan market. It provides real-time vehicle tracking, trip analytics, smart alerts, fuel monitoring, and multi-user organization management through a modern, bilingual (FR/AR) web application with transparent subscription pricing.

---

## 2. Business Justification

### Problem

Fleet operators and individual vehicle owners in Morocco currently lack a modern, self-serve GPS management platform. The dominant competitor (MIA Fleet) requires:
- On-site installation and manual onboarding
- No transparent pricing — quote-only model
- No self-service account management
- No API for integrations

### Opportunity

- Morocco's logistics sector is growing rapidly with e-commerce expansion
- No self-serve, transparent-pricing GPS SaaS exists in the Moroccan market
- Recurring SaaS revenue model is more scalable than hardware + installation contracts
- Bilingual (FR/AR) gap — most platforms are French-only

### Value Proposition

TrackMa offers instant sign-up, transparent pricing, and a modern UX — competing directly on customer experience rather than hardware partnerships.

---

## 3. Goals & Success Criteria

| Goal | Metric | Target |
|---|---|---|
| Launch MVP | Sprint 6 completion | 2026-09-14 |
| First paying customer | Stripe subscription activated | Within 30 days of launch |
| Monthly Recurring Revenue | Stripe dashboard | 5,000 MAD by month 3 post-launch |
| Vehicles tracked | Active vehicle count | 50 vehicles by month 3 |
| Uptime | API availability | ≥ 99.5% |
| Code quality | Test coverage | ≥ 80% (mandatory gate) |

---

## 4. Scope

### In Scope (MVP)

- Real-time GPS map with Leaflet + OpenStreetMap
- Vehicle management (CRUD, IMEI device linking)
- Live WebSocket position updates
- Alert rules engine (speeding, geofence, ignition, low fuel)
- Email notifications for alerts
- Trip history with map replay
- Geofence creation and management
- Fuel monitoring (device-reported or calculated)
- Multi-user organizations with RBAC (4 roles)
- User invite system
- Fleet reports + CSV export
- Stripe self-serve billing (3 tiers)
- Public landing page with pricing (bilingual FR/AR)
- Docker-based deployment

### Out of Scope (Post-MVP)

- Mobile native app (iOS/Android)
- Raw Teltonika binary TCP protocol bridge
- Hardware sales or installation services
- Advanced analytics / BI dashboards
- API marketplace / public API docs
- White-label solution
- Multi-region / multi-country support

---

## 5. Stakeholders

| Stakeholder | Role | Interest | Engagement |
|---|---|---|---|
| Mohamed Rhorba | Product Owner / PM | Build and launch TrackMa | High — all decisions |
| End Users (Professionals) | Primary customers | Fleet cost optimization | Feedback via beta |
| End Users (Individuals) | Secondary customers | Vehicle security | Feedback via beta |
| Stripe | Payment processor | Transaction fees | Integration |
| GPS Device Vendors (Teltonika) | Hardware partners | Device sales | Protocol documentation |
| Maroc Telecom / Inwi | Connectivity | SIM cards for devices | Indirect |

---

## 6. Constraints

| Constraint | Description |
|---|---|
| Timeline | 3 months (12 weeks) — 2026-06-22 to 2026-09-14 |
| Budget | Self-funded — minimize cloud costs in development |
| Team | Solo developer with AI assistance (Claude CTS framework) |
| Technology | Stack locked: Next.js + NestJS + PostgreSQL + Redis + Docker |
| Language | Bilingual FR/AR mandatory for public-facing pages |
| Compliance | CNDP (Commission Nationale de contrôle de la Protection des Données à caractère personnel) — data protection for Moroccan users |

---

## 7. Assumptions

- GPS devices capable of MQTT or can be bridged via simple script
- Stripe supports MAD (Moroccan Dirham) — confirmed ✅
- OpenStreetMap tiles have adequate coverage for Morocco — confirmed ✅
- Initial deployment on a single VPS is sufficient for MVP load
- Gmail SMTP sufficient for transactional emails at MVP scale (< 500/day)

---

## 8. Risks Summary

See [risk-register.md](risk-register.md) for the full risk register.

| Risk | Probability | Impact |
|---|---|---|
| GPS device MQTT compatibility issues | Medium | High |
| Stripe MAD payout restrictions | Low | High |
| Solo dev timeline slippage | Medium | Medium |
| OpenStreetMap tile performance in Morocco | Low | Medium |

---

## 9. Budget Estimate

| Item | Monthly Cost (MAD) |
|---|---|
| VPS (2 vCPU, 4GB) — DigitalOcean | ~240 MAD |
| Domain (trackma.ma) — annual | ~120 MAD/year |
| Stripe fees | 1.4% + 1.5 MAD per transaction |
| Gmail SMTP (free tier) | 0 |
| OpenStreetMap tiles | 0 |
| **Total MVP infra** | **~360 MAD/month** |

Break-even: 2 Starter subscribers (2 × 299 MAD = 598 MAD/month).

---

## 10. Project Timeline

| Milestone | Date | Deliverable |
|---|---|---|
| Sprint 1 complete | 2026-07-06 | Monorepo scaffold, auth, DB schema |
| Sprint 2 complete | 2026-07-20 | GPS pipeline live, Leaflet map working |
| Sprint 3 complete | 2026-08-03 | Alerts + trip history |
| Sprint 4 complete | 2026-08-17 | Fuel, roles, reports |
| Sprint 5 complete | 2026-08-31 | Billing, public landing page |
| Sprint 6 complete | 2026-09-14 | Security, polish, production deploy |
| **Public Launch** | **2026-09-15** | **TrackMa live** |

---

## 11. Communication & Reporting

- **Session logs**: `.logs/sessions.md` — updated at start and end of every working session
- **Activity log**: `.logs/activity.md` — all completed tasks
- **Decision log**: `.logs/decisions.md` — all architectural and product decisions
- **Issues log**: `.logs/issues.md` — bugs and blockers
- **Risk log**: `.logs/risks.md` — risk status updates
- **Metrics**: `.logs/metrics.md` — test coverage, velocity

---

## 12. Approval

| Role | Name | Date |
|---|---|---|
| Project Owner | Mohamed Rhorba | 2026-06-22 |
