# Product Roadmap — TrackMa

**Version**: 1.0  
**Horizon**: 12 months (Launch + 9 months post-launch)

---

## Phase 1 — MVP (Now → 2026-09-14)

**Goal**: Ship a working, self-serve GPS fleet management SaaS that can acquire first paying customers in Morocco.

| Sprint | Period | Deliverable |
|---|---|---|
| ✅ Sprint 1 | Jun 22 – Jul 06 | Monorepo, Docker, auth, DB schema, all service skeletons |
| Sprint 2 | Jul 07 – Jul 20 | GPS pipeline (MQTT→Redis→WS), Leaflet live map, vehicle CRUD |
| Sprint 3 | Jul 21 – Aug 03 | Alerts engine, trip history + replay, geofences |
| Sprint 4 | Aug 04 – Aug 17 | Fuel monitoring, RBAC roles, user invites, reports |
| Sprint 5 | Aug 18 – Aug 31 | Stripe billing, public landing page, FR/AR bilingual |
| Sprint 6 | Sep 01 – Sep 14 | Security hardening, E2E tests, CI/CD, demo mode, launch |

---

## Phase 2 — Growth (Oct 2026 – Jan 2027)

**Goal**: Retain first customers, improve reliability, start word-of-mouth growth in Morocco.

| Feature | Priority | Sprint |
|---|---|---|
| Mobile-responsive dashboard improvements | Must | Oct |
| Driver mobile view (own vehicle only) | Should | Oct |
| Webhook / API access for Pro+ tier | Should | Nov |
| White-label subdomain support | Could | Nov |
| Recurring report emails (weekly summary) | Should | Nov |
| SMS alerts (Twilio / Orange SMS API) | Should | Dec |
| Advanced geofence scheduling (active hours) | Could | Dec |
| Vehicle maintenance reminders (mileage-based) | Could | Jan |
| Bulk vehicle import (CSV) | Should | Jan |

---

## Phase 3 — Scale (Feb 2027 – Jun 2027)

**Goal**: Expand product depth, support larger fleet customers, explore regional expansion.

| Feature | Priority | Notes |
|---|---|---|
| Native iOS app (React Native) | Should | Fleet managers on the go |
| Native Android app | Should | Driver tracking |
| Teltonika binary TCP protocol bridge | Should | Remove MQTT-only limitation |
| TimescaleDB / position data partitioning | Should | Scale to 10k+ vehicles |
| Real-time traffic overlay | Could | OpenRouteService integration |
| Route optimization suggestions | Could | Google Maps Directions API |
| CAN bus data (fuel, RPM, engine codes) | Could | Via Teltonika IO elements |
| Marketplace integrations (SAP, Odoo) | Could | Enterprise tier |
| Expansion to Algeria / Tunisia | Could | Arabic-first markets |

---

## Competitive Positioning vs MIA Fleet

| Feature | MIA Fleet | TrackMa MVP | TrackMa Phase 2 |
|---|---|---|---|
| Real-time GPS | ✅ | ✅ | ✅ |
| Fuel monitoring | ✅ | ✅ | ✅ |
| Alerts | ✅ | ✅ | ✅ + SMS |
| Trip history | ✅ | ✅ | ✅ |
| Self-serve signup | ❌ | ✅ | ✅ |
| Transparent pricing | ❌ | ✅ | ✅ |
| Public API / webhooks | ❌ | ❌ | ✅ |
| Mobile app | Unknown | ❌ | ✅ |
| Arabic interface | Unknown | ✅ | ✅ |
| Online demo | ❌ | ✅ | ✅ |

---

## Pricing Strategy

### MVP Tiers (MAD/month)

| Tier | Price | Vehicles | Target Customer |
|---|---|---|---|
| **Starter** | 299 MAD | 5 | Small delivery business, individual owner |
| **Pro** | 799 MAD | 25 | Mid-size logistics company |
| **Business** | 1,999 MAD | Unlimited | Large fleet operators |

### Post-MVP Considerations

- Annual billing discount (2 months free — saves 17%)
- Per-vehicle pricing option for large fleets (>50 vehicles)
- Add-on: SMS alerts pack (100 SMS/month for +99 MAD)
- Free trial: 14 days, 2 vehicles (current default trial tier)
