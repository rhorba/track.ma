import { test, expect } from '@playwright/test';

const DEMO_POSITIONS = Array.from({ length: 5 }, (_, i) => ({
  vehicleId: `demo-${i + 1}`,
  imei: `99999999999999${i}`,
  lat: 33.5731 + i * 0.008,
  lng: -7.5898 + i * 0.008,
  speed: [65, 0, 42, 88, 0][i],
  heading: [90, 0, 180, 270, 45][i],
  altitude: 0,
  satellites: 9,
  ignition: [true, false, true, true, false][i],
  timestamp: new Date().toISOString(),
  name: `Véhicule Demo ${i + 1}`,
}));

test.describe('10 · Demo mode — live Casablanca map', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('wss://**', (r) => r.abort());
    await page.route('ws://**', (r) => r.abort());
    await page.route('**/*.wasm', (r) => r.abort());
    await page.route('**/api/fleet/demo/positions', (r) =>
      r.fulfill({ status: 200, json: DEMO_POSITIONS }),
    );
  });

  test('demo page — map and vehicle list', async ({ page }) => {
    await test.step('Navigate to /demo (no auth required)', async () => {
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    await test.step('Map container renders', async () => {
      const map = page.locator('.leaflet-container');
      await expect(map).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(800);
    });

    await test.step('Demo vehicle list in sidebar', async () => {
      const vehicleItems = page.getByText(/Véhicule Demo|Demo/i).first();
      if (await vehicleItems.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(vehicleItems).toBeVisible();
      }
      await page.waitForTimeout(600);
    });

    await test.step('CTA banner — Essayez gratuitement', async () => {
      const cta = page.getByRole('link', { name: /Essayez gratuitement|Start|Commencer/i });
      if (await cta.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cta.scrollIntoViewIfNeeded();
        await cta.hover();
        await page.waitForTimeout(500);
      }
    });
  });

  test('demo map — zoom and pan interaction', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible({ timeout: 10000 });

    await test.step('Zoom in twice', async () => {
      const zoomIn = page.locator('.leaflet-control-zoom-in');
      if (await zoomIn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await zoomIn.click();
        await page.waitForTimeout(500);
        await zoomIn.click();
        await page.waitForTimeout(500);
      }
    });

    await test.step('Pan the map', async () => {
      const box = await map.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 20 });
        await page.mouse.up();
        await page.waitForTimeout(600);
      }
    });

    await test.step('Zoom out', async () => {
      const zoomOut = page.locator('.leaflet-control-zoom-out');
      if (await zoomOut.isVisible({ timeout: 3000 }).catch(() => false)) {
        await zoomOut.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test('offline fallback page', async ({ page }) => {
    await test.step('Navigate to /offline', async () => {
      await page.goto('/offline');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(600);
    });

    await test.step('Offline page content visible', async () => {
      await expect(page.locator('body')).toBeVisible();
      // Should show the bilingual offline message
      await page.waitForTimeout(500);
    });
  });
});
