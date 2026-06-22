# API Reference — TrackMa Core API

Base URL: `http://localhost:3001/api`

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### POST /auth/register

Create a new user account and organization.

**Request**
```json
{
  "name": "Mohamed Rhorba",
  "email": "user@example.com",
  "password": "securepassword123",
  "organizationName": "Rhorba Logistics"
}
```

**Response 201**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Mohamed Rhorba",
    "role": "org_admin",
    "organizationId": "uuid"
  }
}
```

---

### POST /auth/login

**Request**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response 200** — same structure as register.

---

### POST /auth/refresh

Exchange a refresh token for a new access token.

**Request**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### POST /auth/logout 🔒

Invalidates the current user's refresh token.

**Response 200** `{}`

---

## Users

### GET /users/me 🔒

Returns the authenticated user's profile.

**Response 200**
```json
{
  "id": "uuid",
  "name": "Mohamed Rhorba",
  "email": "user@example.com",
  "role": "org_admin",
  "organizationId": "uuid",
  "createdAt": "2026-06-22T10:00:00Z"
}
```

---

### GET /users/team 🔒

Returns all users in the authenticated user's organization.

**Response 200** — array of user objects.

---

## Organizations

### GET /organizations/me 🔒

Returns the authenticated user's organization with members and vehicles.

**Response 200**
```json
{
  "id": "uuid",
  "name": "Rhorba Logistics",
  "slug": "rhorba-logistics",
  "tier": "trial",
  "subscriptionStatus": "trialing",
  "vehicleLimit": 2,
  "users": [...],
  "vehicles": [...]
}
```

---

## Vehicles

### GET /vehicles 🔒

List all active vehicles in the organization.

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Camion 01",
    "plate": "12345-A-1",
    "type": "truck",
    "status": "active",
    "imei": "123456789012345",
    "driverName": "Youssef Alami",
    "fuelConsumptionRate": 12.5
  }
]
```

---

### GET /vehicles/:id 🔒

Get a single vehicle by ID.

---

### POST /vehicles 🔒

Create a new vehicle.

**Request**
```json
{
  "name": "Camion 01",
  "plate": "12345-A-1",
  "type": "truck",
  "imei": "123456789012345",
  "driverName": "Youssef Alami",
  "fuelConsumptionRate": 12.5
}
```

**Vehicle types**: `car` | `truck` | `van` | `motorcycle` | `boat` | `scooter`

---

### PATCH /vehicles/:id 🔒

Update vehicle details. Same body as POST, all fields optional.

---

### DELETE /vehicles/:id 🔒

Soft-delete a vehicle (sets `isActive: false`).

---

## Fleet (Positions)

### GET /fleet/positions 🔒

Get the latest position for all vehicles in the organization.

**Response 200**
```json
[
  {
    "vehicle": { "id": "uuid", "name": "Camion 01", "status": "active" },
    "position": {
      "lat": 33.5731,
      "lng": -7.5898,
      "speed": 45,
      "heading": 90,
      "ignition": true,
      "fuelLevel": 72,
      "timestamp": "2026-06-22T10:30:00Z"
    }
  }
]
```

### GET /fleet/history/:vehicleId 🔒

Get position history for a vehicle.

**Query params**
- `from` — ISO date (default: 24h ago)
- `to` — ISO date (default: now)

**Response 200** — array of position objects ordered by timestamp ASC.

---

## WebSocket — Live Positions

Connect to: `ws://localhost:3001/fleet`

**Join your organization's room** (send after connecting):
```json
{ "event": "join", "data": { "orgId": "your-org-uuid" } }
```

**Receive position updates**:
```json
{
  "event": "position",
  "data": {
    "vehicleId": "uuid",
    "imei": "123456789012345",
    "lat": 33.5731,
    "lng": -7.5898,
    "speed": 45,
    "heading": 90,
    "ignition": true,
    "fuelLevel": 72,
    "timestamp": "2026-06-22T10:30:00Z"
  }
}
```

---

## Alerts

### GET /alerts 🔒

List recent alerts (last 100) for the organization.

**Response 200**
```json
[
  {
    "id": "uuid",
    "type": "speeding",
    "severity": "warning",
    "message": "Camion 01 exceeded 120 km/h (actual: 135 km/h)",
    "acknowledged": false,
    "triggeredAt": "2026-06-22T10:15:00Z",
    "vehicle": { "id": "uuid", "name": "Camion 01" }
  }
]
```

**Alert types**: `speeding` | `geofence_enter` | `geofence_exit` | `ignition_on` | `ignition_off` | `low_fuel` | `offline`

---

### GET /alerts/rules 🔒

List all alert rules for the organization.

---

### POST /alerts/rules 🔒

Create a new alert rule.

**Request — Speeding rule**
```json
{
  "name": "Autoroute speed limit",
  "type": "speeding",
  "config": { "speedLimit": 120 },
  "notifyByEmail": true,
  "vehicleId": null
}
```

**Request — Geofence rule**
```json
{
  "name": "Casablanca Zone Exit",
  "type": "geofence_exit",
  "config": { "geofenceId": "uuid" },
  "notifyByEmail": true
}
```

**Request — Low fuel rule**
```json
{
  "name": "Low fuel warning",
  "type": "low_fuel",
  "config": { "fuelThreshold": 15 },
  "notifyByEmail": true
}
```

Set `vehicleId` to `null` to apply the rule to all vehicles in the org.

---

### PATCH /alerts/:id/acknowledge 🔒

Mark an alert as acknowledged.

**Response 200** `{}`

---

## Trips

### GET /trips/vehicle/:vehicleId 🔒

List completed trips for a vehicle (last 50).

**Response 200**
```json
[
  {
    "id": "uuid",
    "vehicleId": "uuid",
    "startedAt": "2026-06-22T08:00:00Z",
    "endedAt": "2026-06-22T09:15:00Z",
    "distanceKm": 87.3,
    "durationSeconds": 4500,
    "maxSpeedKmh": 118,
    "avgSpeedKmh": 69.8,
    "fuelConsumedL": 10.2,
    "startLat": 33.5731, "startLng": -7.5898,
    "endLat": 33.9716, "endLng": -6.8498
  }
]
```

---

### GET /trips/:id/positions 🔒

Get all GPS positions for a trip (for map replay).

**Response 200** — array of position objects ordered by timestamp ASC.

---

## Reports

### GET /reports/summary 🔒

Fleet summary statistics for a date range.

**Query params**
- `from` — ISO date (default: 30 days ago)
- `to` — ISO date (default: now)

**Response 200**
```json
{
  "totalKm": "1240.5",
  "totalFuel": "148.2",
  "totalTrips": "43"
}
```

---

## Billing

### POST /billing/checkout 🔒

Create a Stripe Checkout session for a subscription upgrade.

**Request**
```json
{
  "priceId": "price_xxxxx",
  "returnUrl": "http://localhost:3000"
}
```

**Response 200**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "id": "cs_test_..."
}
```

Redirect the user to the returned `url`.

---

### POST /billing/webhook

Stripe webhook endpoint. Must be registered in the Stripe dashboard.

**Headers**
```
stripe-signature: t=...,v1=...
```

Handles events:
- `customer.subscription.created`
- `customer.subscription.updated`

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Email already in use",
  "error": "Bad Request"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation error or bad request body |
| 401 | Missing or invalid JWT token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Rate limit exceeded (100 req/min) |
| 500 | Internal server error |

---

## Rate Limiting

All endpoints are rate-limited to **100 requests per minute** per IP. Headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1719050460
```
