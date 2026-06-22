# Security Review — TrackMa

**Author**: Security Engineer  
**Date**: 2026-06-22  
**Standard**: OWASP Top 10 (2021)  
**Status**: Sprint 1 baseline — full review scheduled Sprint 6

---

## Threat Model

### Assets to Protect

| Asset | Value | Sensitivity |
|---|---|---|
| GPS position data | Real-time vehicle locations | High — reveals user movements |
| User credentials | Email + password hashes | High |
| Organization data | Fleet info, driver names | Medium |
| Stripe payment data | Handled by Stripe (never stored) | N/A |
| JWT secrets | Signing keys | Critical |
| SMTP credentials | Email account access | High |

### Threat Actors

| Actor | Motivation | Capability |
|---|---|---|
| External attacker | Steal location data, account takeover | Medium (automated scanners) |
| Competitor | Access customer fleet data | Low |
| Malicious user | Access other orgs' data | Medium (authenticated) |
| GPS device attacker | Inject fake positions | Low (needs MQTT access) |

---

## OWASP Top 10 Assessment

### A01 — Broken Access Control

**Controls in place**:
- JWT auth required on all private endpoints (`JwtAuthGuard`)
- RBAC via `RolesGuard` — role stored in JWT, enforced per endpoint
- Organization isolation — all queries filter by `organizationId` from JWT payload
- Vehicle ownership check — `findOne` verifies `organizationId` match before returning data

**Gaps** (Sprint 6 tasks):
- [ ] Verify no IDOR vulnerabilities in trips, alerts, geofences endpoints
- [ ] Add integration tests that prove cross-org data access returns 403

**Risk**: Medium → Low after Sprint 6

---

### A02 — Cryptographic Failures

**Controls in place**:
- Passwords hashed with bcrypt (cost factor 12)
- Refresh tokens hashed with bcrypt (cost factor 10) before storage
- HTTPS enforced via nginx in production (Sprint 6)
- JWT signed with HS256 (secrets 64+ chars)

**Gaps**:
- [ ] Enforce HTTPS-only in production nginx config (HSTS header)
- [ ] Audit that no sensitive data appears in logs (passwords, tokens)
- [ ] Consider RS256 asymmetric JWT for Phase 2 (allows stateless verification by external services)

**Risk**: Low

---

### A03 — Injection

**Controls in place**:
- TypeORM parameterized queries — no raw SQL concatenation
- `class-validator` with `whitelist: true` — strips unknown fields, validates types
- Validation pipe applied globally in `main.ts`

**Gaps**:
- [ ] Audit `createQueryBuilder` usages for any user-controlled values in `where` clauses
- [ ] Validate IMEI field format (15-digit numeric) on vehicle creation

**Risk**: Low

---

### A04 — Insecure Design

**Controls in place**:
- Multi-tenant isolation by design (every query scoped to organizationId)
- Soft deletes prevent accidental data exposure after deletion
- Separate GPS Ingestion service — cannot access business data directly

**Gaps**:
- [ ] Rate limit on `/auth/login` specifically (brute force protection)
- [ ] Account lockout after N failed attempts (Sprint 6)

**Risk**: Medium → Low after Sprint 6

---

### A05 — Security Misconfiguration

**Controls in place**:
- CORS restricted to `APP_URL` origin
- `.env` gitignored, no secrets in repository
- Helmet.js planned for Sprint 6 (security headers)

**Gaps**:
- [ ] Add `helmet()` to `main.ts` (removes X-Powered-By, adds CSP, HSTS, etc.)
- [ ] Disable TypeORM `synchronize` in production
- [ ] Review Docker Compose for exposed ports (postgres, redis should not be on 0.0.0.0 in production)
- [ ] Mosquitto: enable authentication in production config

**Risk**: Medium → Low after Sprint 6

---

### A06 — Vulnerable & Outdated Components

**Controls in place**:
- All dependencies on latest stable versions (pnpm install as of 2026-06-22)
- GitHub Actions CI runs on every push

**Gaps**:
- [ ] Add `pnpm audit` to CI pipeline (Sprint 6)
- [ ] Set up Dependabot for automated security PRs
- [ ] Pin Docker image versions (e.g., `postgres:16.3-alpine` not `postgres:16-alpine`)

**Risk**: Low

---

### A07 — Identification & Authentication Failures

**Controls in place**:
- 15-minute access token expiry
- 7-day refresh token with rotation (new pair on every refresh)
- Refresh token hash stored (invalidated on logout)
- `isActive` flag checked on every JWT validation

**Gaps**:
- [ ] Implement rate limiting on `/auth/login` (max 5 attempts per 15min per email)
- [ ] Add refresh token family detection (invalidate all tokens if rotation violation detected)

**Risk**: Low

---

### A08 — Software & Data Integrity Failures

**Controls in place**:
- pnpm lock file committed — deterministic installs
- Docker images pulled by digest in production (planned Sprint 6)

**Gaps**:
- [ ] Verify Stripe webhook signature in `BillingController.webhook` (already implemented via `stripe.webhooks.constructEvent`)
- [ ] Add subresource integrity for any CDN-hosted scripts

**Risk**: Low

---

### A09 — Security Logging & Monitoring Failures

**Controls in place**:
- NestJS `Logger` used in services for key events
- Docker stdout logging

**Gaps**:
- [ ] Log failed auth attempts with IP (for anomaly detection)
- [ ] Log all admin actions (user role changes, vehicle deletions)
- [ ] Structured logging (JSON format for log aggregation tools)
- [ ] Alert on repeated 401s from same IP (Sprint 6)

**Risk**: Medium → Low after Sprint 6

---

### A10 — Server-Side Request Forgery (SSRF)

**Assessment**: No user-supplied URLs are fetched server-side in the current implementation.

**Risk**: Low

---

## MQTT Security

| Threat | Current State | Action |
|---|---|---|
| Unauthorized device publishing | allow_anonymous=true in dev | Production: enable password auth in mosquitto.conf |
| IMEI spoofing | Any device can publish for any IMEI | Mitigated by vehicle registration — unregistered IMEIs are dropped |
| MQTT traffic interception | No TLS in dev | Production: enable TLS on port 8883 |
| Fake position injection | Anyone with MQTT access can publish | Requires MQTT auth to prevent; anomaly detection (Sprint 6) |

---

## Sprint 6 Security Checklist

- [ ] `helmet()` middleware in `main.ts`
- [ ] Rate limiting on `/auth/login` (5 req/15min per email)
- [ ] HTTPS + HSTS in nginx production config
- [ ] `pnpm audit` in CI — fail on critical vulnerabilities
- [ ] Mosquitto auth enabled in production config
- [ ] PostgreSQL and Redis not exposed externally in docker-compose.prod.yml
- [ ] OWASP ZAP or similar scan against staging environment
- [ ] Privacy Policy page referencing CNDP compliance
- [ ] Data deletion endpoint (GDPR/CNDP right to erasure)
- [ ] All logs reviewed for sensitive data leakage
