import type { Page } from '@playwright/test';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const FAKE_TOKEN = (() => {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(
    JSON.stringify({
      sub: 'user-1',
      email: 'ahmed@casalogistique.ma',
      name: 'Ahmed Benchekroun',
      orgId: 'org-1',
      role: 'org_admin',
      iat: 1699999999,
      exp: 9999999999,
    }),
  ).toString('base64url');
  return `${h}.${p}.fakesig`;
})();

export async function injectAuth(page: Page) {
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
  }, FAKE_TOKEN);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_ORG = {
  id: 'org-1',
  name: 'Casa Logistique',
  slug: 'casalogistique',
  tier: 'pro',
  subscriptionStatus: 'active',
  vehicleLimit: 25,
  logoUrl: null,
  primaryColor: '#2563eb',
};

export const MOCK_VEHICLES = [
  { id: 'v-1', name: 'Camion Alpha', licensePlate: '12345-A-1', imei: '111111111111111', make: 'Mercedes', model: 'Sprinter', year: 2022, status: 'active' },
  { id: 'v-2', name: 'Fourgon Bêta', licensePlate: '67890-B-2', imei: '222222222222222', make: 'Renault', model: 'Master', year: 2021, status: 'idle' },
  { id: 'v-3', name: 'Van Gamma', licensePlate: '11111-C-3', imei: '333333333333333', make: 'Ford', model: 'Transit', year: 2023, status: 'offline' },
  { id: 'v-4', name: 'Bus Delta', licensePlate: '22222-D-4', imei: '444444444444444', make: 'Toyota', model: 'HiAce', year: 2020, status: 'active' },
];

export const MOCK_FLEET = MOCK_VEHICLES.map((v, i) => ({
  vehicleId: v.id,
  imei: v.imei,
  lat: 33.5731 + i * 0.01,
  lng: -7.5898 + i * 0.01,
  speed: i === 0 ? 72 : i === 1 ? 0 : 0,
  heading: 90,
  altitude: 0,
  satellites: 8,
  ignition: v.status === 'active',
  timestamp: new Date().toISOString(),
}));

export const MOCK_ALERTS = [
  { id: 'a-1', type: 'speeding', severity: 'critical', vehicleId: 'v-1', vehicleName: 'Camion Alpha', message: 'Vitesse 142 km/h — limite 120 km/h', acknowledged: false, triggeredAt: new Date(Date.now() - 300_000).toISOString() },
  { id: 'a-2', type: 'geofence_exit', severity: 'warning', vehicleId: 'v-2', vehicleName: 'Fourgon Bêta', message: 'Sortie de zone Casablanca Centre', acknowledged: false, triggeredAt: new Date(Date.now() - 900_000).toISOString() },
  { id: 'a-3', type: 'ignition_on', severity: 'info', vehicleId: 'v-3', vehicleName: 'Van Gamma', message: 'Véhicule allumé', acknowledged: true, triggeredAt: new Date(Date.now() - 1_800_000).toISOString() },
  { id: 'a-4', type: 'low_fuel', severity: 'warning', vehicleId: 'v-4', vehicleName: 'Bus Delta', message: 'Carburant bas — 12%', acknowledged: false, triggeredAt: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 'a-5', type: 'offline', severity: 'critical', vehicleId: 'v-3', vehicleName: 'Van Gamma', message: 'Hors ligne depuis 30 min', acknowledged: false, triggeredAt: new Date(Date.now() - 1_800_000).toISOString() },
];

export const MOCK_TRIPS = [
  { id: 't-1', vehicleId: 'v-1', startedAt: new Date(Date.now() - 7_200_000).toISOString(), endedAt: new Date(Date.now() - 5_400_000).toISOString(), distanceKm: 48.3, durationSeconds: 1800, avgSpeed: 96.6, maxSpeed: 130, isComplete: true },
  { id: 't-2', vehicleId: 'v-2', startedAt: new Date(Date.now() - 14_400_000).toISOString(), endedAt: new Date(Date.now() - 10_800_000).toISOString(), distanceKm: 22.1, durationSeconds: 3600, avgSpeed: 22.1, maxSpeed: 80, isComplete: true },
  { id: 't-3', vehicleId: 'v-4', startedAt: new Date(Date.now() - 21_600_000).toISOString(), endedAt: new Date(Date.now() - 18_000_000).toISOString(), distanceKm: 61.7, durationSeconds: 3600, avgSpeed: 61.7, maxSpeed: 110, isComplete: true },
];

export const MOCK_SUMMARY = { totalKm: 132.1, totalTrips: 3, avgSpeed: 60.1, fuelConsumedL: 48.2 };

export const MOCK_VEHICLE_STATS = MOCK_VEHICLES.slice(0, 3).map((v, i) => ({
  vehicleId: v.id,
  vehicleName: v.name,
  totalKm: [48.3, 22.1, 61.7][i],
  totalFuel: [18.2, 8.4, 21.6][i],
  avgSpeed: [96.6, 22.1, 61.7][i],
  tripCount: [1, 1, 1][i],
}));

export const MOCK_TEAM = [
  { id: 'u-1', name: 'Ahmed Benchekroun', email: 'ahmed@casalogistique.ma', role: 'org_admin', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'u-2', name: 'Fatima Zahra', email: 'fatima@casalogistique.ma', role: 'fleet_manager', isActive: true, createdAt: '2026-02-01T00:00:00.000Z' },
  { id: 'u-3', name: 'Youssef Alami', email: 'youssef@casalogistique.ma', role: 'driver', isActive: true, createdAt: '2026-03-01T00:00:00.000Z' },
];

export const MOCK_USAGE = {
  tier: 'pro',
  subscriptionStatus: 'active',
  vehicleCount: 4,
  vehicleLimit: 25,
  userCount: 3,
};

export const MOCK_GEOFENCES = [
  { id: 'g-1', name: 'Casablanca Centre', polygon: [{ lat: 33.58, lng: -7.60 }, { lat: 33.59, lng: -7.58 }, { lat: 33.57, lng: -7.57 }], isActive: true },
];

// ── Route helpers ─────────────────────────────────────────────────────────────

/** Block all WebSocket connections (prevents Leaflet socket errors in tests). */
export async function blockWs(page: Page) {
  await page.route('wss://**', (r) => r.abort());
  await page.route('ws://**', (r) => r.abort());
  await page.route('**/*.wasm', (r) => r.abort());
}

/** Mount the standard authenticated API routes used by most pages. */
export async function mountAuthApi(page: Page) {
  await page.route('**/api/organizations/me', (r) =>
    r.fulfill({ status: 200, json: MOCK_ORG }),
  );
  await page.route('**/api/organizations/me/usage', (r) =>
    r.fulfill({ status: 200, json: MOCK_USAGE }),
  );
  await page.route('**/api/fleet/positions', (r) =>
    r.fulfill({ status: 200, json: MOCK_FLEET }),
  );
  await page.route('**/api/geofences', (r) =>
    r.fulfill({ status: 200, json: MOCK_GEOFENCES }),
  );
  await page.route('**/api/vehicles', (r) =>
    r.fulfill({ status: 200, json: MOCK_VEHICLES }),
  );
  await page.route('**/api/alerts', (r) =>
    r.fulfill({ status: 200, json: MOCK_ALERTS }),
  );
  await page.route('**/api/alerts/rules', (r) =>
    r.fulfill({ status: 200, json: [] }),
  );
  await page.route('**/api/reports/summary**', (r) =>
    r.fulfill({ status: 200, json: MOCK_SUMMARY }),
  );
  await page.route('**/api/reports/trips**', (r) =>
    r.fulfill({ status: 200, json: MOCK_TRIPS }),
  );
  await page.route('**/api/reports/by-vehicle**', (r) =>
    r.fulfill({ status: 200, json: MOCK_VEHICLE_STATS }),
  );
  await page.route('**/api/users/team', (r) =>
    r.fulfill({ status: 200, json: MOCK_TEAM }),
  );
}

/** Short visual pause — makes the video easier to follow. */
export const pause = (ms = 600) => new Promise((r) => setTimeout(r, ms));
