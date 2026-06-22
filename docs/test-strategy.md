# Test Strategy — TrackMa

**Author**: Test Architect  
**Date**: 2026-06-22  
**Coverage Gate**: ≥ 80% combined unit + integration (mandatory before SHIP)

---

## Testing Pyramid

```
         ▲
        /E2E\          Playwright — critical user flows
       /──────\        ~10 scenarios, runs in CI
      /  Integ  \      Supertest — API endpoints
     /────────────\    ~50 tests, real DB (test schema)
    /    Unit       \  Jest — services, pure logic
   /──────────────────\  ~100+ tests, mocked dependencies
```

---

## Unit Tests (Jest)

Target: All service methods with business logic.

### Core API — Priority Test Targets

| Service | Key scenarios to test |
|---|---|
| `AuthService.register` | Happy path, duplicate email → ConflictException |
| `AuthService.login` | Valid credentials, wrong password → UnauthorizedException |
| `AuthService.refresh` | Valid token, tampered token, missing token |
| `VehiclesService.findOne` | Own vehicle returns, cross-org → ForbiddenException |
| `VehiclesService.create` | Creates correctly, assigns organizationId |
| Alert engine | Speeding rule triggers above threshold, dedup prevents double alerts |
| Trip detection | Ignition ON opens trip, ignition OFF closes + calculates distance |
| `BillingService.resolveTier` | Each price ID maps to correct tier |

### GPS Ingestion — Priority Test Targets

| Service | Key scenarios to test |
|---|---|
| `MqttIngestionService.parseTeltonikaRecord` | Microdegree conversion, IO element extraction |
| `MqttIngestionService.handleMessage` | Generic JSON parsed correctly, unknown topic dropped |
| Teltonika IO mapping | Ignition ID 239, fuel ID 9, odometer ID 16 |

### Test file conventions

```
apps/api/src/modules/auth/auth.service.spec.ts
apps/api/src/modules/vehicles/vehicles.service.spec.ts
apps/gps-ingestion/src/modules/mqtt-ingestion/mqtt-ingestion.service.spec.ts
```

### Example unit test pattern

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        { provide: getRepositoryToken(Organization), useValue: createMockRepository() },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  it('throws ConflictException when email already exists', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'existing' } as User);
    await expect(service.register({ email: 'test@test.com', name: 'Test', password: '12345678' }))
      .rejects.toThrow(ConflictException);
  });
});
```

---

## Integration Tests (Supertest)

Target: All REST endpoints with a real PostgreSQL test database.

### Setup

```typescript
// test/setup.ts
beforeAll(async () => {
  app = await createTestApp();  // uses DATABASE_URL pointing to trackma_test DB
});

afterEach(async () => {
  await clearDatabase();  // truncate all tables between tests
});
```

### Priority endpoint tests

```
POST /api/auth/register → 201 with tokens
POST /api/auth/login → 200 with tokens, 401 with bad password
GET /api/vehicles → 200 with org vehicles only
POST /api/vehicles → 201 created
PATCH /api/vehicles/:id → 200 updated, 403 cross-org
GET /api/alerts → 200 list
PATCH /api/alerts/:id/acknowledge → 200 acknowledged
GET /api/trips/vehicle/:id → 200 trip list
POST /api/billing/checkout → 200 Stripe URL returned
```

### Cross-org isolation tests (critical)

```typescript
it('cannot access vehicles from another organization', async () => {
  const { token: orgAToken } = await registerOrg('Org A');
  const { token: orgBToken } = await registerOrg('Org B');
  const vehicle = await createVehicle(orgAToken, { name: 'Test' });

  const response = await request(app.getHttpServer())
    .get(`/api/vehicles/${vehicle.id}`)
    .set('Authorization', `Bearer ${orgBToken}`);

  expect(response.status).toBe(403);
});
```

---

## E2E Tests (Playwright)

**Location**: `apps/web/e2e/`  
**Environment**: Full Docker stack (staging)

### Critical Flows

| Scenario | Steps |
|---|---|
| User registration + onboarding | Visit /, click CTA, register, see empty dashboard |
| Add vehicle | Navigate to vehicles, click Add, fill form, save, vehicle appears in list |
| View live map | Navigate to dashboard, map loads, markers visible (requires demo seed data) |
| Create alert rule | Navigate to alerts/rules, create speeding rule, rule appears in list |
| Acknowledge alert | Trigger alert via simulator, see toast, navigate to alerts, acknowledge |
| View trip history | Navigate to vehicle trips, click a trip, route displays on map |
| Billing upgrade | Navigate to billing, click Upgrade, complete Stripe test checkout, plan updates |
| Language switch | Click AR toggle, verify RTL layout and Arabic text |

### Video recording (Sprint 6 milestone)

At project v0.1.0 completion, run:
```bash
PLAYWRIGHT_VIDEO=on pnpm --filter web e2e
# Videos saved to .recordings/v0.1.0-2026-09-14.webm
```

---

## Performance Tests

**Sprint 6 — load test scenarios** (using k6 or Artillery):

```
Scenario 1: 50 concurrent users viewing the live map
  → All receive WebSocket updates within 2 seconds
  → API response time < 300ms p99

Scenario 2: 500 GPS position events per minute
  → All stored in PostgreSQL without queue backup
  → Redis pub/sub latency < 50ms
```

---

## Coverage Configuration

`apps/api/package.json` — jest config:

```json
"coverageThreshold": {
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

CI fails if coverage drops below 80% — no exceptions.

---

## Adversarial Test Cases

Edge cases the test suite must cover:

| Scenario | Expected behavior |
|---|---|
| JWT with future `iat` (clock skew attack) | Rejected by JWT validation |
| Position with lat/lng = 0,0 (device reset) | Stored but not shown on map (filter null-island positions) |
| MQTT message with missing lat field | Logged as error, dropped, processing continues |
| Trip with ignition OFF immediately after ON | Trip created and closed with 0 distance |
| Vehicle added beyond tier limit | 403 with upgrade prompt message |
| Stripe webhook with invalid signature | 400 rejected |
| Concurrent vehicle status updates for same vehicle | Last-write-wins (acceptable), no DB deadlock |
| Empty organization (no vehicles) | Dashboard shows empty state, no errors |
