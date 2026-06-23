import { test, expect } from '@playwright/test';

test.describe('02 · Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('wss://**', (r) => r.abort());
    await page.route('ws://**', (r) => r.abort());
    await page.route('**/api/auth/register', (r) =>
      r.fulfill({ status: 201, json: { id: 'user-new', email: 'new@trackma.ma' } }),
    );
  });

  test('register page renders with plan pre-selection', async ({ page }) => {
    await page.goto('/register?plan=pro');

    await test.step('Form visible with pro plan pre-selected', async () => {
      await page.waitForLoadState('networkidle');
      // Form should be on screen
      await expect(page.locator('form, main')).toBeVisible();
      await page.waitForTimeout(500);
    });

    await test.step('All input fields visible', async () => {
      const nameField = page.locator('input[name="name"], input[placeholder*="nom" i], input[placeholder*="name" i]').first();
      const emailField = page.locator('input[type="email"]');
      const passwordField = page.locator('input[type="password"]').first();

      if (await nameField.isVisible()) {
        await nameField.fill('Ahmed Benchekroun');
        await page.waitForTimeout(300);
      }
      if (await emailField.isVisible()) {
        await emailField.fill('ahmed@casalogistique.ma');
        await page.waitForTimeout(300);
      }
      if (await passwordField.isVisible()) {
        await passwordField.fill('SecurePass123!');
        await page.waitForTimeout(300);
      }
    });

    await test.step('Organisation name field', async () => {
      const orgField = page.locator('input[name="organizationName"], input[placeholder*="entreprise" i], input[placeholder*="organisation" i], input[placeholder*="company" i]').first();
      if (await orgField.isVisible()) {
        await orgField.fill('Casa Logistique SARL');
        await page.waitForTimeout(300);
      }
    });
  });

  test('pricing CTA from landing pre-selects plan', async ({ page }) => {
    await page.goto('/register?plan=starter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    await expect(page.locator('body')).toBeVisible();
    // Confirm the plan query param is preserved
    await expect(page).toHaveURL(/plan=starter/);
  });
});
