import { test, expect } from '@playwright/test';
import { FAKE_TOKEN, mountAuthApi, blockWs } from './helpers';

test.describe('01 · Authentication', () => {
  test('login form renders correctly', async ({ page }) => {
    await page.goto('/login');

    await test.step('Form elements visible', async () => {
      await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
    });

    await test.step('Hover over submit button', async () => {
      await page.getByRole('button', { name: 'Se connecter' }).hover();
      await page.waitForTimeout(400);
    });
  });

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (r) =>
      r.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
    );

    await page.goto('/login');

    await test.step('Fill bad credentials', async () => {
      await page.locator('input[type="email"]').fill('wrong@example.com');
      await page.waitForTimeout(300);
      await page.locator('input[type="password"]').fill('badpassword');
      await page.waitForTimeout(300);
    });

    await test.step('Submit and see error', async () => {
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible();
      await page.waitForTimeout(600);
    });
  });

  test('shows loading spinner while submitting', async ({ page }) => {
    await page.route('**/api/auth/login', async (r) => {
      await new Promise((res) => setTimeout(res, 1200));
      await r.fulfill({ status: 401, json: {} });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@trackma.ma');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByRole('button', { name: 'Connexion…' })).toBeVisible();
    await page.waitForTimeout(800);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await blockWs(page);
    await mountAuthApi(page);

    await page.route('**/api/auth/login', (r) =>
      r.fulfill({ status: 201, json: { accessToken: FAKE_TOKEN } }),
    );

    await page.goto('/login');

    await test.step('Fill valid credentials', async () => {
      await page.locator('input[type="email"]').fill('ahmed@casalogistique.ma');
      await page.waitForTimeout(300);
      await page.locator('input[type="password"]').fill('Demo1234!');
      await page.waitForTimeout(300);
    });

    await test.step('Submit and land on dashboard', async () => {
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);
      await page.waitForTimeout(800);
    });
  });
});
