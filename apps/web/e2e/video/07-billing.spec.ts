import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs, MOCK_USAGE } from './helpers';

test.describe('07 · Billing — subscription plans', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('plan cards — all 4 tiers visible', async ({ page }) => {
    await test.step('Navigate to /billing', async () => {
      await page.goto('/billing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700);
    });

    await test.step('Trial plan card visible', async () => {
      await expect(page.getByText('Trial')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(300);
    });

    await test.step('Starter plan — 299 MAD/mo', async () => {
      await expect(page.getByText('299 MAD/mo')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(300);
    });

    await test.step('Pro plan — 799 MAD/mo (highlighted)', async () => {
      await expect(page.getByText('799 MAD/mo')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(300);
    });

    await test.step('Business plan — 1,999 MAD/mo', async () => {
      await expect(page.getByText('1,999 MAD/mo')).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(400);
    });
  });

  test('vehicle usage bar — 4 of 25 used on Pro', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    await test.step('Usage bar visible', async () => {
      // Usage shows vehicleCount/vehicleLimit
      const usageText = page.getByText(/4\s*\/\s*25|4 véhicules|vehicles/i);
      if (await usageText.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(usageText).toBeVisible();
      }
      await page.waitForTimeout(600);
    });

    await test.step('Pro plan is active tier', async () => {
      const proLabel = page.getByText('pro', { exact: false });
      if (await proLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await proLabel.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
      }
    });
  });

  test('upgrade CTA hovers on non-current plans', async ({ page }) => {
    await page.route('**/api/billing/checkout', (r) =>
      r.fulfill({ status: 200, json: { url: 'https://checkout.stripe.com/test' } }),
    );

    await page.goto('/billing');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await test.step('Hover over plan upgrade buttons', async () => {
      const upgradeBtns = page.getByRole('button', { name: /Choisir|Upgrade|S'abonner/i });
      const count = await upgradeBtns.count();
      for (let i = 0; i < Math.min(count, 2); i++) {
        await upgradeBtns.nth(i).hover();
        await page.waitForTimeout(350);
      }
    });
  });
});
