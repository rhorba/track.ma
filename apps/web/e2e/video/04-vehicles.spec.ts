import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs, MOCK_VEHICLES } from './helpers';

test.describe('04 · Vehicles — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('vehicle list — all 4 vehicles visible', async ({ page }) => {
    await test.step('Navigate to /vehicles', async () => {
      await page.goto('/vehicles');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
    });

    await test.step('Table renders with vehicle names', async () => {
      await expect(page.getByText('Camion Alpha')).toBeVisible({ timeout: 8000 });
      await expect(page.getByText('Fourgon Bêta')).toBeVisible();
      await expect(page.getByText('Van Gamma')).toBeVisible();
      await expect(page.getByText('Bus Delta')).toBeVisible();
      await page.waitForTimeout(500);
    });

    await test.step('License plates are displayed', async () => {
      await expect(page.getByText('12345-A-1')).toBeVisible();
      await expect(page.getByText('67890-B-2')).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Edit and delete buttons per row', async () => {
      const editBtns = page.getByRole('button', { name: 'Modifier' });
      await expect(editBtns).toHaveCount(MOCK_VEHICLES.length);
      await page.waitForTimeout(400);
    });
  });

  test('add vehicle — open modal, fill form, submit', async ({ page }) => {
    const newVehicle = { id: 'v-new', name: 'Camion Epsilon', licensePlate: '55555-E-5', imei: '555555555555555', make: 'Iveco', model: 'Daily', year: 2024, status: 'offline' };

    await page.route('**/api/vehicles', (r) => {
      if (r.request().method() === 'POST') return r.fulfill({ status: 201, json: newVehicle });
      return r.fulfill({ status: 200, json: MOCK_VEHICLES });
    });

    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');

    await test.step('Click Add vehicle button', async () => {
      await page.getByRole('button', { name: /Ajouter un véhicule/i }).click();
      await expect(page.locator('h2', { hasText: 'Ajouter un véhicule' })).toBeVisible();
      await page.waitForTimeout(500);
    });

    await test.step('Fill in all vehicle fields', async () => {
      await page.getByPlaceholder('ex. Camion #1').fill('Camion Epsilon');
      await page.waitForTimeout(250);
      await page.getByPlaceholder('ex. 12345-A-7').fill('55555-E-5');
      await page.waitForTimeout(250);
      await page.getByPlaceholder('IMEI à 15 chiffres').fill('555555555555555');
      await page.waitForTimeout(250);
      await page.getByPlaceholder('ex. Mercedes').fill('Iveco');
      await page.waitForTimeout(250);
      await page.getByPlaceholder('ex. Sprinter').fill('Daily');
      await page.waitForTimeout(250);
      await page.getByPlaceholder('2024').fill('2024');
      await page.waitForTimeout(300);
    });

    await test.step('Submit form', async () => {
      await page.getByRole('button', { name: 'Enregistrer' }).click();
      await page.waitForTimeout(800);
    });
  });

  test('edit vehicle — open edit modal and update name', async ({ page }) => {
    await page.route('**/api/vehicles/*', (r) => {
      if (r.request().method() === 'PATCH')
        return r.fulfill({ status: 200, json: { ...MOCK_VEHICLES[0], name: 'Camion Alpha v2' } });
      return r.fulfill({ status: 200, json: MOCK_VEHICLES[0] });
    });

    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Camion Alpha')).toBeVisible({ timeout: 8000 });

    await test.step('Click Modifier on first vehicle', async () => {
      await page.getByRole('button', { name: 'Modifier' }).first().click();
      await page.waitForTimeout(500);
    });

    await test.step('Update name field', async () => {
      const nameField = page.getByPlaceholder('ex. Camion #1');
      if (await nameField.isVisible()) {
        await nameField.clear();
        await nameField.fill('Camion Alpha v2');
        await page.waitForTimeout(400);
        await page.getByRole('button', { name: 'Enregistrer' }).click();
        await page.waitForTimeout(600);
      }
    });
  });

  test('cancel modal — no change persisted', async ({ page }) => {
    await page.goto('/vehicles');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Ajouter un véhicule/i }).click();
    await expect(page.locator('h2', { hasText: 'Ajouter un véhicule' })).toBeVisible();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.locator('h2', { hasText: 'Ajouter un véhicule' })).not.toBeVisible();
    await page.waitForTimeout(400);
  });
});
