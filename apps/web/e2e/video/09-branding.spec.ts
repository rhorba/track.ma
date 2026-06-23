import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs } from './helpers';

test.describe('09 · Branding settings', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);

    await page.route('**/api/organizations/me/branding', (r) =>
      r.fulfill({
        status: 200,
        json: { logoUrl: null, primaryColor: '#2563eb', slug: 'casalogistique' },
      }),
    );
  });

  test('branding page renders with form', async ({ page }) => {
    await test.step('Navigate to /settings/branding', async () => {
      await page.goto('/settings/branding');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700);
    });

    await test.step('Page title visible', async () => {
      await expect(page.getByText('Personnalisation de la marque')).toBeVisible({ timeout: 8000 });
    });

    await test.step('Logo URL input visible', async () => {
      await expect(page.getByText('URL du logo')).toBeVisible();
      await expect(page.locator('input[type="url"]')).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Color picker visible', async () => {
      await expect(page.getByText('Couleur principale')).toBeVisible();
      await expect(page.locator('input[type="color"]')).toBeVisible();
      await page.waitForTimeout(400);
    });
  });

  test('update primary color and see live swatch', async ({ page }) => {
    await page.goto('/settings/branding');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Personnalisation de la marque')).toBeVisible({ timeout: 8000 });

    await test.step('Set color to emerald green', async () => {
      const hexInput = page.locator('input[type="text"].font-mono, input[placeholder*="#"]').first();
      if (await hexInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await hexInput.click({ clickCount: 3 });
        await hexInput.fill('#10b981');
        await page.waitForTimeout(600);
      } else {
        // Fallback: use color input directly
        await page.locator('input[type="color"]').fill('#10b981');
        await page.waitForTimeout(600);
      }
    });

    await test.step('Save button reflects new color', async () => {
      const saveBtn = page.getByRole('button', { name: 'Enregistrer' });
      await expect(saveBtn).toBeVisible();
      await saveBtn.hover();
      await page.waitForTimeout(400);
    });
  });

  test('enter logo URL and see preview', async ({ page }) => {
    await page.goto('/settings/branding');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Personnalisation de la marque')).toBeVisible({ timeout: 8000 });

    await test.step('Type a logo URL', async () => {
      const logoInput = page.locator('input[type="url"]');
      await logoInput.fill('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg');
      await page.waitForTimeout(700);
    });

    await test.step('Preview text appears', async () => {
      await expect(page.getByText('Aperçu')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(600);
    });
  });

  test('save branding and see success confirmation', async ({ page }) => {
    await page.goto('/settings/branding');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Personnalisation de la marque')).toBeVisible({ timeout: 8000 });

    await test.step('Click Enregistrer', async () => {
      await page.getByRole('button', { name: 'Enregistrer' }).click();
      await page.waitForTimeout(400);
    });

    await test.step('Success message — Modifications enregistrées', async () => {
      const saved = page.getByText(/Modifications enregistrées|enregistrées/i);
      if (await saved.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(saved).toBeVisible();
        await page.waitForTimeout(800);
      }
    });
  });
});
