# Sprint Backlog — TrackMa

**Scrum Master**: CTS Framework  
**Velocity baseline**: ~40 story points / sprint  
**Sprint length**: 2 weeks  
**Story point scale**: 1 / 2 / 3 / 5 / 8 / 13

---

## Sprint 1 — Foundation & Scaffold ✅ DONE

**Goal**: Runnable monorepo skeleton with auth, DB schema, all Docker services.  
**Dates**: 2026-06-22 → 2026-07-06  
**Status**: Completed

### Definition of Done ✅
- [x] All 3 apps scaffold and compile with 0 TS errors
- [x] Docker Compose starts all 6 services healthy
- [x] JWT register/login/refresh endpoints work
- [x] All 8 TypeORM entities exist and synchronize to DB
- [x] CI pipeline passes (lint + test + build)
- [x] Git pushed to `main`

### Stories Completed

| Story | Points | Specialist |
|---|---|---|
| Monorepo init with pnpm workspaces | 3 | Tech Lead |
| Docker Compose: all 6 services + healthchecks | 5 | DevOps |
| 8 TypeORM entities (DB schema) | 8 | DBA |
| NestJS Core API scaffold + JWT auth (register/login/refresh/logout) | 8 | Backend Dev |
| NestJS GPS Ingestion scaffold + MQTT client | 5 | Backend Dev |
| Next.js 15 web scaffold + App Router | 3 | Frontend Dev |
| Shared types package (`@trackma/shared`) | 3 | Tech Lead |
| GitHub Actions CI (lint + test + build) | 3 | DevOps |
| `.env.example` + all env vars documented | 2 | DevOps |

**Sprint 1 Total**: 40 pts

---

## Sprint 2 — GPS Pipeline & Live Map

**Goal**: Real GPS data flows from MQTT → Redis → WebSocket → Leaflet map in browser.  
**Dates**: 2026-07-07 → 2026-07-20  
**Status**: Not started

### Stories

**Story 2.1** — Parse Teltonika AVL packets  
```
As a fleet manager,
I want GPS data from Teltonika devices to be received and stored,
So that I can see real vehicle positions.

Acceptance Criteria:
- [ ] Given a Teltonika JSON payload on topic trackma/teltonika/{imei}, when received, then lat/lng/speed/ignition are correctly parsed
- [ ] Given coordinates in Teltonika microdegrees format, when parsed, then they are converted to decimal degrees correctly
- [ ] Given an IMEI not registered to any vehicle, when received, then the message is silently dropped (no error)
- [ ] Given a malformed payload, when received, then error is logged and processing continues
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 2.2** — Redis pub/sub pipeline end-to-end  
```
As a system,
I want GPS Ingestion to publish to Redis and Core API to consume it,
So that position events flow between the two services.

Acceptance Criteria:
- [ ] Given a position published to Redis gps:position channel, when Core API subscriber receives it, then it is stored in the positions table
- [ ] Given a vehicle IMEI that matches a registered vehicle, when position received, then vehicle.status is updated (active/idle/offline)
- [ ] Given a position event, when stored, then Redis latest-position cache is updated with 5min TTL
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 2.3** — Fleet positions API endpoint  
```
As a frontend client,
I want to fetch all current vehicle positions for my organization,
So that I can render the initial map state on load.

Acceptance Criteria:
- [ ] Given GET /api/fleet/positions with valid JWT, when called, then all org vehicles with their latest positions are returned
- [ ] Given a vehicle with no position cached in Redis, when returned, then position is null (not an error)
- [ ] Given an unauthorized request, when called, then 401 is returned
```
**Points**: 3 | **Specialist**: Backend Dev

---

**Story 2.4** — WebSocket gateway live position updates  
```
As a browser dashboard,
I want to receive live vehicle position updates via WebSocket,
So that the map updates in real time without polling.

Acceptance Criteria:
- [ ] Given a connected client in org room, when a position event fires for a vehicle in that org, then client receives 'position' event within 1 second
- [ ] Given a client sending 'join' event with orgId, when processed, then client joins the correct Socket.IO room
- [ ] Given a disconnected client, when reconnected, then it can rejoin without server restart
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 2.5** — Vehicle CRUD API  
```
As an org admin,
I want to create, update, and delete vehicles with IMEI linking,
So that I can manage my fleet.

Acceptance Criteria:
- [ ] Given POST /api/vehicles with valid body, when called, then vehicle is created and returned with id
- [ ] Given PATCH /api/vehicles/:id, when called by org member, then vehicle is updated
- [ ] Given DELETE /api/vehicles/:id, when called, then vehicle is soft-deleted (isActive: false)
- [ ] Given a vehicle from a different org, when accessed, then 403 is returned
- [ ] Given duplicate IMEI, when POST called, then 409 conflict is returned
```
**Points**: 3 | **Specialist**: Backend Dev

---

**Story 2.6** — Leaflet live map dashboard  
```
As a fleet manager,
I want to see all my vehicles on a live map,
So that I can monitor my fleet in real time.

Acceptance Criteria:
- [ ] Given the dashboard loads, when vehicles have positions, then markers appear at correct lat/lng on the map
- [ ] Given a WebSocket 'position' event, when received, then the corresponding marker moves on the map
- [ ] Given a vehicle with ignition=true, when rendered, then marker shows green; ignition=false shows grey
- [ ] Given clicking a marker, when clicked, then a popup shows vehicle name, speed, last update time
- [ ] Given no vehicles registered, when map loads, then an empty state with "Add your first vehicle" CTA is shown
```
**Points**: 8 | **Specialist**: Frontend Dev

---

**Story 2.7** — Vehicle management UI  
```
As an org admin,
I want a UI to add, edit, and delete vehicles,
So that I can manage my fleet without using the API directly.

Acceptance Criteria:
- [ ] Given the /vehicles page, when loaded, then all org vehicles are listed with name, plate, type, status, IMEI
- [ ] Given clicking "Add Vehicle", when form submitted, then vehicle appears in the list
- [ ] Given clicking edit on a vehicle, when changes saved, then updated data is reflected
- [ ] Given clicking delete, when confirmed, then vehicle is removed from the list
- [ ] Given a vehicle with status "offline", when rendered, then a visual indicator (grey badge) is shown
```
**Points**: 8 | **Specialist**: Frontend Dev

**Sprint 2 Total**: 37 pts

---

## Sprint 3 — Alerts & Trip History

**Goal**: Users get notified of events; full trip records with map replay.  
**Dates**: 2026-07-21 → 2026-08-03

### Stories

**Story 3.1** — Alert rules engine  
```
As a fleet manager,
I want alerts to fire automatically when rules are triggered,
So that I am notified of important events without manual monitoring.

Acceptance Criteria:
- [ ] Given a speed alert rule with limit 120, when vehicle speed > 120, then alert is created
- [ ] Given an ignition_on rule, when vehicle ignition switches to true, then alert is created
- [ ] Given a low_fuel rule with threshold 15%, when fuel < 15, then alert is created
- [ ] Given an alert already fired within 5 minutes for same rule+vehicle, when same condition persists, then no duplicate alert is created
- [ ] Given a rule scoped to a specific vehicle, when triggered by a different vehicle, then no alert fires
```
**Points**: 8 | **Specialist**: Backend Dev

---

**Story 3.2** — Email notifications for alerts  
```
As a fleet manager,
I want to receive email alerts when rules trigger,
So that I am notified even when not looking at the dashboard.

Acceptance Criteria:
- [ ] Given an alert with notifyByEmail=true, when triggered, then email is sent to org admin(s) within 30 seconds
- [ ] Given SMTP credentials missing or invalid, when alert fires, then alert is still saved (email failure does not block the alert)
- [ ] Given an alert email, when received, then it includes vehicle name, alert type, value, and timestamp
```
**Points**: 3 | **Specialist**: Backend Dev

---

**Story 3.3** — Trip detection  
```
As a fleet manager,
I want trips to be automatically detected and recorded,
So that I can see when and where each vehicle has been.

Acceptance Criteria:
- [ ] Given ignition turns ON, when position received, then a new Trip record is created with isComplete=false
- [ ] Given ignition turns OFF, when position received, then the active trip is closed with endedAt, distanceKm, durationSeconds
- [ ] Given a trip closed, when computed, then distanceKm is calculated correctly from position sequence (Haversine formula)
- [ ] Given a vehicle with no active trip, when ignition is already OFF, then no trip is created
```
**Points**: 8 | **Specialist**: Backend Dev

---

**Story 3.4** — Geofence CRUD API  
```
As a fleet manager,
I want to define geographic zones,
So that I can trigger alerts when vehicles enter or exit them.

Acceptance Criteria:
- [ ] Given POST /api/geofences with polygon array, when saved, then geofence is created and returned
- [ ] Given a geofence_exit alert rule referencing a geofenceId, when vehicle exits the polygon, then alert fires
- [ ] Given a vehicle inside a geofence, when next position is outside, then geofence_exit event triggers
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 3.5** — Alerts UI  
```
As a fleet manager,
I want to view and manage alerts in the dashboard,
So that I can track and respond to fleet events.

Acceptance Criteria:
- [ ] Given /alerts page, when loaded, then recent alerts are shown with type, vehicle, severity, time
- [ ] Given clicking "Acknowledge", when confirmed, then alert is marked acknowledged and greyed out
- [ ] Given the alert rules config page, when loaded, then existing rules are shown and new rules can be added
```
**Points**: 5 | **Specialist**: Frontend Dev

---

**Story 3.6** — Trip history UI + map replay  
```
As a fleet manager,
I want to view a vehicle's trip history and replay each trip on the map,
So that I can audit driver behavior and routes.

Acceptance Criteria:
- [ ] Given /vehicles/:id/trips, when loaded, then list of completed trips with date, distance, duration is shown
- [ ] Given clicking a trip, when selected, then the map shows the route as a polyline
- [ ] Given clicking "Replay", when activated, then an animated marker moves along the route at real-time speed (compressed)
- [ ] Given a trip with no positions (edge case), when selected, then a graceful "No route data" message is shown
```
**Points**: 8 | **Specialist**: Frontend Dev

---

**Story 3.7** — Geofence drawing UI  
```
As a fleet manager,
I want to draw geofences directly on the map,
So that I don't need to enter coordinates manually.

Acceptance Criteria:
- [ ] Given the geofences page, when "Draw zone" clicked, then Leaflet.draw toolbar appears
- [ ] Given drawing a polygon on the map, when saved, then geofence is stored and visible on map
- [ ] Given an existing geofence, when shown on map, then it renders as a semi-transparent overlay
```
**Points**: 5 | **Specialist**: Frontend Dev

**Sprint 3 Total**: 42 pts

---

## Sprint 4 — Fuel, Roles & Reports

**Goal**: Fuel data visible, multi-user orgs work, exportable reports.  
**Dates**: 2026-08-04 → 2026-08-17

### Stories

**Story 4.1** — Fuel monitoring  
```
As a fleet manager,
I want to see fuel levels and consumption per vehicle,
So that I can optimize costs.

Acceptance Criteria:
- [ ] Given a device reporting fuelLevel in MQTT payload, when stored, then fuel % is visible per vehicle
- [ ] Given a vehicle without device fuel reporting, when fuel consumption rate is set, then fuelConsumedL is calculated per trip
- [ ] Given a low_fuel alert rule, when fuel drops below threshold, then alert fires correctly
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 4.2** — RBAC roles enforcement  
```
As an org admin,
I want role-based access control enforced on all API endpoints,
So that viewers cannot modify data and drivers see only their vehicle.

Acceptance Criteria:
- [ ] Given a viewer role user, when calling PATCH /vehicles/:id, then 403 is returned
- [ ] Given a fleet_manager, when managing vehicles and alerts, then all operations succeed
- [ ] Given a driver role, when calling GET /fleet/positions, then only their assigned vehicle's data is returned
- [ ] Given org_admin, when accessing all endpoints, then full access is granted
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 4.3** — User invite system  
```
As an org admin,
I want to invite team members by email,
So that they can access the dashboard with the correct role.

Acceptance Criteria:
- [ ] Given POST /users/invite with email and role, when called, then invite email is sent
- [ ] Given clicking the invite link, when user registers, then they are added to the org with specified role
- [ ] Given an expired or used invite link, when clicked, then an appropriate error is shown
```
**Points**: 8 | **Specialist**: Backend Dev

---

**Story 4.4** — Reports API (fleet summary + CSV)  
```
As a fleet manager,
I want to export fleet reports,
So that I can share operational data with management.

Acceptance Criteria:
- [ ] Given GET /api/reports/summary?from=&to=, when called, then totalKm, totalFuel, totalTrips are returned
- [ ] Given GET /api/reports/trips/export?vehicleId=, when called, then CSV with trip rows is returned
- [ ] Given a date range with no trips, when called, then empty report is returned (not an error)
```
**Points**: 5 | **Specialist**: Backend Dev

---

**Story 4.5** — Dashboard overview widgets  
```
As a fleet manager,
I want a dashboard with key fleet KPIs,
So that I can get a quick operational overview.

Acceptance Criteria:
- [ ] Given the dashboard, when loaded, then 4 widgets are shown: Active vehicles, Total km today, Active alerts, Fuel consumed today
- [ ] Given a vehicle going offline, when dashboard refreshes, then the "Active vehicles" count updates
```
**Points**: 5 | **Specialist**: Frontend Dev

---

**Story 4.6** — Reports UI + CSV download  
```
As a fleet manager,
I want to view and download fleet reports from the UI,
So that I can analyze data without using the API.

Acceptance Criteria:
- [ ] Given /reports page with date range picker, when filter applied, then summary stats update
- [ ] Given clicking "Export CSV", when clicked, then file downloads with trip data
```
**Points**: 5 | **Specialist**: Frontend Dev

---

**Story 4.7** — Team management UI  
```
As an org admin,
I want to manage my team from the settings page,
So that I can invite, change roles, and remove members.

Acceptance Criteria:
- [ ] Given /settings/team, when loaded, then all org members are listed with name, email, role
- [ ] Given clicking "Invite member", when email + role submitted, then invite is sent
- [ ] Given clicking "Change role", when new role selected, then role updates immediately
- [ ] Given clicking "Remove", when confirmed, then user is removed from org
```
**Points**: 5 | **Specialist**: Frontend Dev

**Sprint 4 Total**: 38 pts

---

## Sprint 5 — Billing & Public Site

**Goal**: Self-serve sign-up with Stripe; public marketing site live.  
**Dates**: 2026-08-18 → 2026-08-31

### Stories

**Story 5.1** — Stripe checkout + subscriptions  
```
As a new user,
I want to select a subscription plan and pay online,
So that I can activate TrackMa without contacting anyone.

Acceptance Criteria:
- [ ] Given POST /api/billing/checkout with priceId, when called, then Stripe Checkout URL is returned
- [ ] Given completing checkout, when webhook fires, then org tier and vehicleLimit update correctly
- [ ] Given a cancelled subscription webhook, when processed, then org reverts to trial tier
```
**Points**: 8 | **Specialist**: Backend Dev

---

**Story 5.2** — Vehicle count tier enforcement  
```
As the system,
I want to block adding vehicles beyond the tier limit,
So that billing tiers have real value.

Acceptance Criteria:
- [ ] Given a Starter org (limit 5), when adding a 6th vehicle, then 403 with "Upgrade your plan" is returned
- [ ] Given an upgrade to Pro, when webhook processed, then vehicleLimit updates to 25 immediately
```
**Points**: 3 | **Specialist**: Backend Dev

---

**Story 5.3** — Public landing page  
```
As a potential customer,
I want to understand TrackMa's value before signing up,
So that I can make an informed decision.

Acceptance Criteria:
- [ ] Given visiting /, when loaded, then hero section with CTA "Essayez gratuitement" is visible
- [ ] Given scrolling, when sections passed, then Features, How it works, Pricing, Contact sections are visible
- [ ] Given the Pricing section, when rendered, then all 3 tiers with prices in MAD and feature lists are shown
- [ ] Given clicking a pricing CTA, when clicked, then user is directed to /register?plan=xxx
```
**Points**: 13 | **Specialist**: Frontend Dev

---

**Story 5.4** — Billing settings page  
```
As a subscriber,
I want to view and manage my subscription from the settings,
So that I can upgrade or cancel without contacting support.

Acceptance Criteria:
- [ ] Given /settings/billing, when loaded, then current plan, vehicle usage, and next billing date are shown
- [ ] Given clicking "Upgrade", when plan selected, then Stripe Checkout opens
- [ ] Given plan is "Business", when on billing page, then no upgrade option is shown
```
**Points**: 5 | **Specialist**: Frontend Dev

---

**Story 5.5** — FR/AR bilingual support  
```
As a Moroccan user,
I want to use TrackMa in French or Arabic,
So that I can use the platform in my preferred language.

Acceptance Criteria:
- [ ] Given a language toggle in the nav, when clicked, then all UI text switches between FR and AR
- [ ] Given Arabic selected, when rendered, then RTL layout is applied correctly
- [ ] Given the landing page, when in AR mode, then all marketing copy is in Arabic
```
**Points**: 5 | **Specialist**: Frontend Dev

**Sprint 5 Total**: 34 pts

---

## Sprint 6 — Security, Polish & Launch

**Goal**: Production-ready, secure, tested, demo-able. Ship it.  
**Dates**: 2026-09-01 → 2026-09-14

### Stories

**Story 6.1** — Security hardening  
```
As a security engineer,
I want the API to be protected against common attack vectors,
So that the platform is safe for production use.

Acceptance Criteria:
- [ ] Given any API endpoint, when called without JWT, then 401 is returned
- [ ] Given 100+ requests/min from one IP, when throttling kicks in, then 429 is returned
- [ ] Given malformed input (SQL injection attempt, XSS payload), when validated, then 400 is returned and no data leaks
- [ ] Given OWASP Top 10 checklist reviewed, when complete, then no critical or high issues remain
```
**Points**: 8 | **Specialist**: Security Engineer

---

**Story 6.2** — E2E test suite  
```
As a QA engineer,
I want an automated E2E test suite covering critical user flows,
So that regressions are caught before deploy.

Acceptance Criteria:
- [ ] Given Playwright suite, when run, then sign-up → add vehicle → view map → create alert → view trip flows all pass
- [ ] Given a failing E2E test in CI, when detected, then the build fails and deploy is blocked
```
**Points**: 8 | **Specialist**: Tester

---

**Story 6.3** — Unit + integration test coverage gate  
```
As a team,
I want ≥80% test coverage on the Core API and GPS Ingestion,
So that we can ship with confidence.

Acceptance Criteria:
- [ ] Given pnpm test:cov on api, when run, then combined coverage ≥ 80%
- [ ] Given pnpm test:cov on gps-ingestion, when run, then coverage ≥ 80%
- [ ] Given coverage < 80%, when CI runs, then the build fails
```
**Points**: 8 | **Specialist**: Tester

---

**Story 6.4** — Demo mode  
```
As a potential customer,
I want to try a live demo without registering,
So that I can evaluate TrackMa before committing.

Acceptance Criteria:
- [ ] Given visiting /demo, when loaded, then a map with 5 fake vehicles moving around Casablanca is shown
- [ ] Given demo vehicles, when simulated, then positions update every 10 seconds via WebSocket
- [ ] Given the demo page, when interacting, then a "Start your free trial" CTA is prominent
```
**Points**: 5 | **Specialist**: Backend Dev + Frontend Dev

---

**Story 6.5** — Production Docker Compose + nginx  
```
As a DevOps engineer,
I want a production-ready Docker Compose with nginx reverse proxy,
So that the app can be deployed to a VPS securely.

Acceptance Criteria:
- [ ] Given docker compose -f docker-compose.prod.yml up, when run, then all services start and nginx proxies correctly
- [ ] Given HTTPS configured with SSL certs, when accessed, then site loads over HTTPS with valid cert
- [ ] Given HTTP request, when received, then nginx redirects to HTTPS
```
**Points**: 5 | **Specialist**: DevOps

---

**Story 6.6** — PostgreSQL performance audit  
```
As a DBA,
I want query performance validated before launch,
So that the app remains responsive under realistic load.

Acceptance Criteria:
- [ ] Given EXPLAIN ANALYZE on top 5 most frequent queries, when reviewed, then no sequential scans on large tables
- [ ] Given positions table with 100k rows seeded, when queried, then vehicle history query completes < 100ms
```
**Points**: 3 | **Specialist**: DBA

**Sprint 6 Total**: 37 pts
