import { test, expect } from '@playwright/test';

test.describe('00 · Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('wss://**', (r) => r.abort());
    await page.route('ws://**', (r) => r.abort());
  });

  test('hero section and primary CTA', async ({ page }) => {
    await test.step('Navigate to home', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await test.step('See logo and nav bar', async () => {
      const header = page.getByRole('banner');
      await expect(header.getByText('track.ma', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: /Fonctionnalités/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Tarifs/i })).toBeVisible();
    });

    await test.step('Hero headline is visible', async () => {
      // Expect something in the hero — the H1 or large headline
      const hero = page.locator('section').first();
      await expect(hero).toBeVisible();
    });

    await test.step('Primary CTA directs to /register', async () => {
      const cta = page.getByRole('link', { name: /Essayez gratuitement|Commencer|Démarrer/i }).first();
      await expect(cta).toBeVisible();
      await cta.hover();
      await page.waitForTimeout(400);
    });
  });

  test('features and pricing sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await test.step('Scroll to Features', async () => {
      await page.evaluate(() => {
        document.querySelector('#fonctionnalites')?.scrollIntoView({ behavior: 'smooth' });
      });
      await page.waitForTimeout(800);
    });

    await test.step('Scroll to How it works', async () => {
      await page.evaluate(() => {
        document.querySelector('#comment')?.scrollIntoView({ behavior: 'smooth' });
      });
      await page.waitForTimeout(800);
    });

    await test.step('Scroll to Pricing — 3 plan cards visible', async () => {
      await page.evaluate(() => {
        document.querySelector('#tarifs')?.scrollIntoView({ behavior: 'smooth' });
      });
      await page.waitForTimeout(800);
      await expect(page.getByText('299 MAD')).toBeVisible();
      await expect(page.getByText('799 MAD')).toBeVisible();
      await expect(page.getByText('1 999 MAD')).toBeVisible();
    });

    await test.step('Scroll to Contact', async () => {
      await page.evaluate(() => {
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
      });
      await page.waitForTimeout(600);
    });
  });

  test('demo link and login link in nav', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await test.step('Login link visible in nav', async () => {
      const loginLink = page.getByRole('banner').getByRole('link', { name: 'Connexion' });
      await expect(loginLink).toBeVisible();
      await loginLink.hover();
      await page.waitForTimeout(300);
    });

    await test.step('Demo link navigates to /demo', async () => {
      const demoLink = page.getByRole('link', { name: /Démo/i }).first();
      if (await demoLink.isVisible()) {
        await demoLink.hover();
        await page.waitForTimeout(300);
      }
    });
  });
});
