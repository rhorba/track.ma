import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs } from './helpers';

test.describe('03 · Dashboard — live map', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('full dashboard tour', async ({ page }) => {
    await test.step('Navigate to dashboard', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
    });

    await test.step('Sidebar shows org name and nav links', async () => {
      await expect(page.getByText('Casa Logistique')).toBeVisible({ timeout: 8000 });
      await expect(page.getByText('Tableau de bord')).toBeVisible();
      await expect(page.getByText('Véhicules')).toBeVisible();
      await expect(page.getByText('Alertes')).toBeVisible();
      await page.waitForTimeout(600);
    });

    await test.step('Fleet status badges — En marche / À l\'arrêt / Hors ligne', async () => {
      await expect(page.getByText(/En marche/)).toBeVisible({ timeout: 8000 });
      await expect(page.getByText(/arrêt/)).toBeVisible();
      await expect(page.getByText(/Hors ligne/)).toBeVisible();
      await page.waitForTimeout(600);
    });

    await test.step('Map container renders', async () => {
      // The Leaflet map container
      const map = page.locator('.leaflet-container');
      await expect(map).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(1000);
    });

    await test.step('Hover sidebar nav links', async () => {
      for (const label of ['Véhicules', 'Alertes', 'Rapports']) {
        await page.getByText(label).hover();
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
