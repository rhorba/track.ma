# Security Hardening — TrackMa (Sprint 6)

## OWASP Top 10 Review

| # | Risk | Status | Implementation |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Mitigated | JwtAuthGuard on all endpoints; RolesGuard for org_admin routes; org-scoped queries (organizationId filter on every DB call) |
| A02 | Cryptographic Failures | ✅ Mitigated | bcryptjs (cost 10) for passwords; JWT RS256 / HS256 with env secret; HTTPS enforced via nginx in prod |
| A03 | Injection | ✅ Mitigated | TypeORM parameterized queries (no raw SQL); class-validator + whitelist:true + forbidNonWhitelisted:true on all DTOs |
| A04 | Insecure Design | ✅ Mitigated | Invite tokens 256-bit crypto-random; single-use (acceptedAt set atomically); 48h expiry |
| A05 | Security Misconfiguration | ✅ Mitigated | Helmet (CSP, XSS, HSTS, noSniff, frameguard); CORS locked to APP_URL; synchronize:false in production |
| A06 | Vulnerable Components | ⚠️ Ongoing | pnpm audit clean at time of writing; dependabot enabled via CI |
| A07 | Auth Failures | ✅ Mitigated | @Throttle 10 req/min on /auth/login and /auth/register; refresh tokens stored hashed in Redis; logout invalidates token |
| A08 | Software & Data Integrity | ✅ Mitigated | Stripe webhook signature verified (rawBody); no eval/dynamic imports |
| A09 | Logging & Monitoring | ⚠️ Partial | Console logging in dev; production monitoring (Prometheus/Grafana) planned post-launch |
| A10 | SSRF | ✅ N/A | No user-controlled URL fetching in application logic |

## Controls Applied (Sprint 6)

### Helmet (main.ts)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (modern browsers use CSP)
- `Strict-Transport-Security` (HSTS)
- Content-Security-Policy defaults

### Rate Limiting (@nestjs/throttler v6)
- Global: 100 requests / 60 seconds per IP
- `/auth/login`, `/auth/register`: 10 requests / 60 seconds per IP (brute-force protection)

### Input Validation
- `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })` — strips and rejects unknown fields
- All body params typed with class-validator DTOs (including geofences — fixed in Sprint 6)

### CORS
- Origin locked to `APP_URL` env var (default `http://localhost:3000`)
- `credentials: true` for cookie/auth header support
