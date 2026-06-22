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

const MOCK_VEHICLES = [
  {
    id: 'v-1',
    name: 'Truck Alpha',
    licensePlate: '12345-A-1',
    imei: '111111111111111',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2022,
    status: 'active',
  },
  {
    id: 'v-2',
    name: 'Van Beta',
    licensePlate: '67890-B-2',
    imei: '222222222222222',
    make: 'Renault',
    model: 'Master',
    year: 2021,
    status: 'idle',
  },
];

test.describe('Vehicles page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
    }, FAKE_TOKEN);

    await page.route('**/api/vehicles', (route) => {
      if (route.request().method() === 'GET')
        return route.fulfill({ status: 200, json: MOCK_VEHICLES });
      return route.fulfill({
        status: 201,
        json: { id: 'v-new', name: 'New Truck', licensePlate: '99999-C-3', imei: '333333333333333', make: 'Ford', model: 'Transit', year: 2023, status: 'offline' },
      });
    });
  });

  test('renders the vehicles table with data', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page.getByText('Truck Alpha')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Van Beta')).toBeVisible();
  });

  test('displays vehicle licence plates in the table', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page.getByText('12345-A-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('67890-B-2')).toBeVisible();
  });

  test('opens Add vehicle modal on button click', async ({ page }) => {
    await page.goto('/vehicles');
    await page.getByRole('button', { name: /add vehicle/i }).click();
    await expect(page.locator('h2', { hasText: 'Add vehicle' })).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Truck #1')).toBeVisible();
  });

  test('closes modal when Cancel is clicked', async ({ page }) => {
    await page.goto('/vehicles');
    await page.getByRole('button', { name: /add vehicle/i }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('h2', { hasText: 'Add vehicle' })).not.toBeVisible();
  });

  test('submits new vehicle via POST /api/vehicles', async ({ page }) => {
    let posted = false;
    await page.route('**/api/vehicles', (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        return route.fulfill({ status: 201, json: MOCK_VEHICLES[0] });
      }
      return route.fulfill({ status: 200, json: MOCK_VEHICLES });
    });

    await page.goto('/vehicles');
    await page.getByRole('button', { name: /add vehicle/i }).click();

    await page.getByPlaceholder('e.g. Truck #1').fill('New Truck');
    await page.getByPlaceholder('e.g. 12345-A-7').fill('99999-C-3');
    await page.getByPlaceholder('15-digit IMEI').fill('333333333333333');
    await page.getByPlaceholder('e.g. Mercedes').fill('Ford');
    await page.getByPlaceholder('e.g. Sprinter').fill('Transit');
    await page.getByPlaceholder('2024').fill('2023');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => posted, { timeout: 5000 }).toBe(true);
  });

  test('shows Edit and Delete buttons for each vehicle', async ({ page }) => {
    await page.goto('/vehicles');
    await expect(page.getByText('Truck Alpha')).toBeVisible({ timeout: 10000 });

    const editButtons = page.getByRole('button', { name: 'Edit' });
    await expect(editButtons).toHaveCount(MOCK_VEHICLES.length);

    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    await expect(deleteButtons).toHaveCount(MOCK_VEHICLES.length);
  });
});
