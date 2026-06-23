import { test, expect } from '@playwright/test';
import { injectAuth, mountAuthApi, blockWs, MOCK_TEAM } from './helpers';

test.describe('08 · Admin — team management', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await blockWs(page);
    await mountAuthApi(page);
  });

  test('team table — 3 members with role badges', async ({ page }) => {
    await test.step('Navigate to /admin', async () => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700);
    });

    await test.step('Ahmed — org_admin role badge', async () => {
      await expect(page.getByText('Ahmed Benchekroun')).toBeVisible({ timeout: 8000 });
      await expect(page.getByText('Admin')).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Fatima — fleet_manager role', async () => {
      await expect(page.getByText('Fatima Zahra')).toBeVisible();
      await expect(page.getByText('Fleet Manager')).toBeVisible();
      await page.waitForTimeout(400);
    });

    await test.step('Youssef — driver role', async () => {
      await expect(page.getByText('Youssef Alami')).toBeVisible();
      await expect(page.getByText('Driver')).toBeVisible();
      await page.waitForTimeout(400);
    });
  });

  test('invite member modal', async ({ page }) => {
    await page.route('**/api/users/invite', (r) =>
      r.fulfill({ status: 201, json: { message: 'Invite sent' } }),
    );

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Ahmed Benchekroun')).toBeVisible({ timeout: 8000 });

    await test.step('Open invite modal', async () => {
      const inviteBtn = page.getByRole('button', { name: /Inviter|Invite/i });
      await expect(inviteBtn).toBeVisible();
      await inviteBtn.click();
      await page.waitForTimeout(500);
    });

    await test.step('Fill email and select role', async () => {
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill('nouveau@casalogistique.ma');
        await page.waitForTimeout(300);

        const roleSelect = page.locator('select');
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption('viewer');
          await page.waitForTimeout(300);
        }
      }
    });

    await test.step('Send invite', async () => {
      const sendBtn = page.getByRole('button', { name: /Envoyer|Send/i });
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(800);
      } else {
        // Close modal if send btn not found
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }
    });
  });

  test('role change dropdown', async ({ page }) => {
    await page.route('**/api/users/u-2/role', (r) =>
      r.fulfill({ status: 200, json: { ...MOCK_TEAM[1], role: 'viewer' } }),
    );

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Fatima Zahra')).toBeVisible({ timeout: 8000 });

    await test.step('Change Fatima role to viewer', async () => {
      const roleSelects = page.locator('select');
      const count = await roleSelects.count();
      if (count > 0) {
        // Second member's role select
        const select = roleSelects.nth(Math.min(1, count - 1));
        if (await select.isVisible()) {
          await select.selectOption('viewer');
          await page.waitForTimeout(600);
        }
      }
    });
  });
});
