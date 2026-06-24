
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

## 2026-06-23 — Sprint 7 Story 7.4: Multi-tenant Branding ✅

- `organization.entity.ts`: added `logoUrl` (nullable) + `primaryColor` (nullable, default '#2563eb')
- `migrations/1719100000000-AddOrgBranding.ts`: adds logo_url + primary_color columns (IF NOT EXISTS)
- `organizations/dto/update-branding.dto.ts`: UpdateBrandingDto (IsUrl logoUrl, Matches hex primaryColor)
- `organizations.service.ts`: updateBranding() + findBySlugPublic() methods
- `organizations.controller.ts`: PATCH /me/branding (auth), GET /public?slug (public, SkipThrottle)
- `apps/web/src/lib/branding.tsx`: BrandingContext — fetches org, injects --color-primary CSS var
- `apps/web/src/components/Providers.tsx`: BrandingProvider wraps ThemeProvider children
- `apps/web/src/components/Sidebar.tsx`: org logo + brand color on active nav link
- `apps/web/src/lib/i18n.tsx`: branding translation keys (fr + ar)
- `apps/web/src/app/settings/branding/page.tsx`: logo URL input + color picker + preview + save
- `apps/web/src/middleware.ts`: subdomain slug → x-org-slug header
- `apps/web/src/lib/api.ts`: getMyOrg(), updateBranding(), getPublicBranding() calls
- Tests: 145 passed, 29 suites | Coverage: Stmt 90.46% | Branch 75.82% | Fn 86.66% | Lines 90.47%
- Commit: 10b288c pushed to origin/main

## 2026-06-23 — Sprint 7 Stories 7.5 + 7.6: Load Testing + SEO/CDN ✅

### Story 7.5 — Load Testing (k6)
- `k6/smoke.js`: 1 VU, 30s — auth → positions → vehicles → alerts → reports/summary; thresholds p95<500ms
- `k6/load.js`: 0→50 VUs ramp (6 min); custom Trends for position/vehicle/alert latency; p95<300/400/400ms
- `k6/soak.js`: 20 VUs sustained 10 min; drift detection via p1_position_latency Trend
- `docs/load-testing.md`: bottleneck analysis (Redis, TypeORM pool, GROUP BY queries), DB pool reco (max:25), CI integration steps

### Story 7.6 — SEO + CDN
- `apps/web/src/app/layout.tsx`: metadataBase, full OG/Twitter cards, hreflang alternates, keywords, robots directive
- `apps/web/src/app/page.tsx`: page-level SEO metadata + canonical URL
- `apps/web/src/app/demo/page.tsx`: OG + Twitter card metadata
- `apps/web/src/app/sitemap.ts`: MetadataRoute.Sitemap — /, /register, /demo, /login
- `apps/web/src/app/robots.ts`: MetadataRoute.Robots — allow public pages, disallow dashboard/api
- `apps/web/src/app/opengraph-image.tsx`: Edge runtime OG image 1200×630 (ImageResponse)
- `apps/web/next.config.ts`: Cache-Control headers (immutable static, s-maxage=3600 public, no-store auth, security headers)
- `.env.example`: NEXT_PUBLIC_SITE_URL added

- Tests: 145 passed, 29 suites — all green | Coverage unchanged ≥ thresholds
- Commit: dff16f2 pushed to origin/main

## SPRINT_SNAPSHOT — Sprint 7 COMPLETE ✅
Stories: 7.1 Arabic RTL | 7.2 PWA | 7.3 Analytics | 7.4 Multi-tenant Branding | 7.5 Load Testing | 7.6 SEO+CDN
Total: 39 pts | API tests: 145 passing | Coverage: Stmt 90.46% / Branch 75.82% / Fn 86.66% / Lines 90.47%
