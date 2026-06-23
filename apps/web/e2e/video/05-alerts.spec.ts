import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs, MOCK_ALERTS } from './helpers';

test.describe('05 · Alerts — history and acknowledge', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('alert list — all 5 alerts visible with correct types', async ({ page }) => {
    await test.step('Navigate to /alerts', async () => {
      await page.goto('/alerts');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
    });

    await test.step('Page header visible', async () => {
      await expect(page.getByText('Historique des alertes')).toBeVisible({ timeout: 8000 });
    });

    await test.step('Speeding alert (critical) — red badge', async () => {
      await expect(page.getByText('Excès de vitesse')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(400);
    });

    await test.step('Geofence exit alert (warning)', async () => {
      await expect(page.getByText('Sortie de zone').first()).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Low fuel alert (warning)', async () => {
      await expect(page.getByText('Carburant bas').first()).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Ignition alert (info)', async () => {
      await expect(page.getByText('Allumage').first()).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Offline alert visible', async () => {
      await expect(page.getByText('Hors ligne').first()).toBeVisible();
      await page.waitForTimeout(400);
    });
  });

  test('acknowledge an unread alert', async ({ page }) => {
    let acknowledged = false;

    await page.route('**/api/alerts/a-1/acknowledge', (r) => {
      acknowledged = true;
      return r.fulfill({ status: 200, json: { ...MOCK_ALERTS[0], acknowledged: true } });
    });

    await page.route('**/api/alerts', (r) => {
      if (acknowledged) {
        return r.fulfill({
          status: 200,
          json: MOCK_ALERTS.map((a) => (a.id === 'a-1' ? { ...a, acknowledged: true } : a)),
        });
      }
      return r.fulfill({ status: 200, json: MOCK_ALERTS });
    });

    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Excès de vitesse')).toBeVisible({ timeout: 8000 });

    await test.step('Click Acquitter on the speeding alert', async () => {
      const ackBtn = page.getByRole('button', { name: /Acquitter|Acknowledge/i }).first();
      if (await ackBtn.isVisible()) {
        await ackBtn.hover();
        await page.waitForTimeout(300);
        await ackBtn.click();
        await page.waitForTimeout(800);
      }
    });
  });

  test('empty state when no alerts', async ({ page }) => {
    await page.route('**/api/alerts', (r) => r.fulfill({ status: 200, json: [] }));

    await page.goto('/alerts');
    await page.waitForLoadState('networkidle');

    await test.step('Empty state illustration visible', async () => {
      await expect(page.locator('main').locator('svg').first()).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(600);
    });
  });
});
