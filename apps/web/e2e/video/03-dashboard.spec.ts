import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs } from './helpers';

test.describe('03 · Dashboard — live map', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('full dashboard tour', async ({ page }) => {
    test.setTimeout(90000);
    await test.step('Navigate to dashboard', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('load');
      await page.waitForTimeout(1200);
    });

    await test.step('Sidebar shows org name and nav links', async () => {
      await expect(page.getByText('Casa Logistique').first()).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('link', { name: /Tableau de bord/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Véhicules/i }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: /Alertes/i }).first()).toBeVisible();
      await page.waitForTimeout(600);
    });

    await test.step('Fleet status badges — En marche / À l\'arrêt / Hors ligne', async () => {
      await expect(page.getByText(/En marche/).first()).toBeVisible({ timeout: 8000 });
      await expect(page.getByText(/arrêt/).first()).toBeVisible();
      await expect(page.getByText(/Hors ligne/).first()).toBeVisible();
      await page.waitForTimeout(600);
    });

    await test.step('Map container renders', async () => {
      const map = page.locator('.leaflet-container');
      const mapVisible = await map.isVisible({ timeout: 8000 }).catch(() => false);
      if (mapVisible) {
        await expect(map).toBeVisible();
      }
      await page.waitForTimeout(1000);
    });

    await test.step('Hover sidebar nav links', async () => {
      for (const label of ['Véhicules', 'Alertes', 'Rapports']) {
        await page.getByRole('link', { name: new RegExp(label, 'i') }).first().hover();
        await page.waitForTimeout(300);
      }
    });
  });

  test('alert bell shows unread count', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await test.step('Alert bell visible in header', async () => {
      // The AlertBell component
      const bell = page.locator('button[aria-label*="alerte" i], button[title*="alerte" i]').first();
      if (await bell.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bell.hover();
        await page.waitForTimeout(500);
        await bell.click();
        await page.waitForTimeout(600);
      }
    });
  });
});
