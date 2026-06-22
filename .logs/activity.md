
## 2026-06-22 — Sprint 6 Batch 1: Security Hardening ✅

- `main.ts`: helmet() added; ValidationPipe now `forbidNonWhitelisted: true`
- `app.module.ts`: APP_GUARD → ThrottlerGuard (100 req/min global)
- `auth.controller.ts`: @Throttle 10 req/min on /auth/login and /auth/register
- `geofences.controller.ts`: `body: any` replaced with typed `CreateGeofenceDto` (with nested `PolygonPointDto`)
- `auth.controller.spec.ts`: 5 tests — service delegation + throttle metadata checks
- `docs/security-hardening.md`: OWASP Top 10 review documented
- Tests: 48/48 passing, 0 TS errors

## 2026-06-22 — Sprint 6 Batch 2: Public Landing Page ✅

- `apps/web/src/app/page.tsx`: full landing page (Nav, Hero, Features ×4, How it works ×3, Pricing ×3 in MAD, Contact, Footer)
- `apps/web/src/app/register/page.tsx`: registration form with plan query param (?plan=trial|starter|pro)
- All CTAs link to /register?plan=xxx; Login link in nav; Demo link to /demo
- 0 TS errors

## 2026-06-22 — Sprint 6 Batch 3: Demo Mode ✅

- `app.module.ts`: ScheduleModule.forRoot() added
- `fleet/demo.service.ts`: DemoService — 5 fake Casablanca vehicles, @Interval(10s), random walk within bbox
- `fleet/fleet.gateway.ts`: join-demo WS event → client joins 'demo' room (no auth)
- `fleet/fleet.module.ts`: DemoService added to providers + exports
- `fleet/fleet.controller.ts`: GET /fleet/demo/positions (public, SkipThrottle) for SSR seed data
- `lib/socket.ts`: useDemoSocket() hook — joins demo room, listens for position events
- `app/demo/page.tsx` + `DemoClient.tsx`: full demo page — sidebar with vehicle list, Leaflet map, CTA banner
- Tests: 48/48 passing, 0 TS errors

## 2026-06-22 — Sprint 6 Batch 4: DB Performance Audit ✅

- `alert.entity.ts`: @Index(['vehicleId','triggeredAt']), @Index(['vehicleId','acknowledged'])
- `geofence.entity.ts`: @Index(['organizationId','isActive'])
- `trip.entity.ts`: @Index(['vehicleId','startedAt']), @Index(['vehicleId','isComplete'])
- `alert-rule.entity.ts`: @Index(['organizationId','isActive'])  — hot path: loaded on every GPS event
- `vehicle.entity.ts`: @Index(['organizationId','isActive'])
- `migrations/1719000000000-AddPerformanceIndexes.ts`: 8 CONCURRENTLY-safe indexes for production
- `docs/db-performance.md`: EXPLAIN ANALYZE analysis for 5 top queries + post-launch recommendations
- Tests: 48/48 passing, 0 TS errors

## 2026-06-22 — Sprint 6 Batch 5: French Copy Pass ✅

- Sidebar: nav labels → FR (Tableau de bord, Véhicules, Alertes, Rapports, Abonnement); theme toggle → FR
- Dashboard: "Live Map" → "Carte en direct", status badges → FR, vehicle count → FR
- Vehicles: all labels, table headers, modal, form fields, buttons → FR
- Alerts: type labels → FR (Excès de vitesse, Entrée en zone…), headers, empty states → FR
- AlertBell: "Alertes", unread count → FR
- Reports: title, stat cards, table headers, empty states → FR
- Login: title, labels, error message, button → FR
- Tests: 48/48 passing, 0 TS errors
