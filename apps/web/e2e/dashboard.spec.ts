import { test, expect } from '@playwright/test';

const FAKE_TOKEN = (() => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-1',
      email: 'test@trackma.com',
      name: 'Test User',
      orgId: 'org-1',
      role: 'org_admin',
      iat: 1699999999,
      exp: 9999999999,
    }),
  ).toString('base64url');
  return `${header}.${payload}.fakesig`;
})();

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
    }, FAKE_TOKEN);

    await page.route('**/api/fleet/positions', (route) =>
      route.fulfill({
        status: 200,
        json: [
          {
            vehicleId: 'v-1',
            imei: '123456789',
            lat: 33.5731,
            lng: -7.5898,
            speed: 60,
            heading: 90,
            altitude: 0,
            satellites: 8,
            ignition: true,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    );
    await page.route('**/api/geofences', (route) =>
      route.fulfill({ status: 200, json: [] }),
    );
    await page.route('wss://**', (route) => route.abort());
    await page.route('ws://**', (route) => route.abort());
  });

  test('loads without crashing', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('shows fleet status badges', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Active/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Idle/)).toBeVisible();
    await expect(page.getByText(/Offline/)).toBeVisible();
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('track.ma')).toBeVisible({ timeout: 10000 });
  });
});
