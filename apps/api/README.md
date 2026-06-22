# TrackMa — Core API

NestJS REST API + WebSocket server. Handles authentication, fleet management, alerts, trips, reports, and billing.

**Port**: 3001  
**Base path**: `/api`

## Modules

| Module | Path | Responsibility |
|---|---|---|
| Auth | `src/modules/auth` | JWT register/login/refresh, bcrypt, RBAC guards |
| Users | `src/modules/users` | User profile, team listing |
| Organizations | `src/modules/organizations` | Org details, settings |
| Vehicles | `src/modules/vehicles` | CRUD, IMEI linking, soft delete |
| Fleet | `src/modules/fleet` | Position storage, Redis caching, WebSocket gateway |
| Alerts | `src/modules/alerts` | Alert rules engine, alert history, acknowledge |
| Trips | `src/modules/trips` | Trip detection, history, position replay |
| Reports | `src/modules/reports` | Fleet summary stats, CSV export |
| Billing | `src/modules/billing` | Stripe checkout, webhook handler, tier enforcement |
| Redis | `src/modules/redis` | Global Redis client + subscriber injection |
| Mail | `src/modules/mail` | SMTP email service (alert notifications, invites) |

## Running

```bash
# From monorepo root
pnpm --filter api dev

# Or directly
cd apps/api && pnpm start:dev
```

## Environment Variables

See root `.env.example`. API-specific vars:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

## Testing

```bash
pnpm test          # Unit tests
pnpm test:cov      # Coverage (target >= 80%)
pnpm test:e2e      # End-to-end tests
```

## Key Files

```
src/
├── main.ts                  App bootstrap (CORS, validation, port)
├── app.module.ts            Root module — all imports
├── entities/                TypeORM entities (DB schema)
│   ├── organization.entity.ts
│   ├── user.entity.ts
│   ├── vehicle.entity.ts
│   ├── position.entity.ts
│   ├── trip.entity.ts
│   ├── alert-rule.entity.ts
│   ├── alert.entity.ts
│   └── geofence.entity.ts
└── modules/
    ├── auth/                JWT auth, guards, strategies, decorators
    ├── fleet/               WebSocket gateway + position service
    └── ...                  One folder per module
```

## API Documentation

See [../../docs/api-reference.md](../../docs/api-reference.md) for the full REST endpoint reference.
