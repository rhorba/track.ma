import { test, expect } from '@playwright/test';

const FAKE_TOKEN = (() => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-1',
      email: 'test@trackma.com',
      name: 'Test User',
      orgId: 'org-1',
      role: 'org_admin',
      iat: 1699999999,
      exp: 9999999999,
    }),
  ).toString('base64url');
  return `${header}.${payload}.fakesig`;
})();

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, json: { message: 'Unauthorized' } }),
    );

    await page.locator('input[type="email"]').fill('bad@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows loading state while submitting', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({ status: 401, json: {} });
    });

    await page.locator('input[type="email"]').fill('test@trackma.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByRole('button', { name: 'Connexion…' })).toBeVisible();
  });

  test('redirects to dashboard on successful login', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 201, json: { accessToken: FAKE_TOKEN } }),
    );
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, json: [] }),
    );
    await page.route('**/*.wasm', (route) => route.abort());

    await page.locator('input[type="email"]').fill('test@trackma.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
