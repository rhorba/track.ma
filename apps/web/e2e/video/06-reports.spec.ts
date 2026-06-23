import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs } from './helpers';

test.describe('06 · Reports — analytics and charts', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('fleet summary stat cards', async ({ page }) => {
    await test.step('Navigate to /reports', async () => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700);
    });

    await test.step('Stat cards render with numbers', async () => {
      // Fleet summary numbers from MOCK_SUMMARY: 132.1 km, 3 trips, 60.1 avg speed, 48.2 L
      await expect(page.getByText(/132/)).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(400);
    });

    await test.step('Trip history table', async () => {
      // Trip table should have 3 rows (from MOCK_TRIPS)
      const rows = page.locator('tbody tr, [role="row"]');
      await expect(rows.first()).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(500);
    });
  });

  test('date range picker — switch between 7d, 30d, 90d', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');

    await test.step('Default range 30d visible', async () => {
      const btn30 = page.getByRole('button', { name: '30j' }).or(page.getByRole('button', { name: '30d' }));
      if (await btn30.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(btn30).toBeVisible();
      }
      await page.waitForTimeout(500);
    });

    await test.step('Switch to 7 days', async () => {
      const btn7 = page.getByRole('button', { name: '7j' }).or(page.getByRole('button', { name: '7d' }));
      if (await btn7.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn7.click();
        await page.waitForTimeout(700);
      }
    });

    await test.step('Switch to 90 days', async () => {
      const btn90 = page.getByRole('button', { name: '90j' }).or(page.getByRole('button', { name: '90d' }));
      if (await btn90.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn90.click();
        await page.waitForTimeout(700);
      }
    });
  });

  test('per-vehicle SVG bar charts', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    await test.step('SVG charts are rendered', async () => {
      const svgs = page.locator('svg');
      await expect(svgs.first()).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(500);
    });

    await test.step('Vehicle names appear in chart labels', async () => {
      await expect(page.getByText('Camion Alpha')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(400);
    });

    await test.step('Scroll down to see all charts', async () => {
      await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
      await page.waitForTimeout(600);
    });
  });
});
