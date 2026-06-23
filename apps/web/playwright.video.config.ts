import { defineConfig, devices } from '@playwright/test';

/**
 * Video recording config — runs all e2e/video/ specs serially with video: 'on'.
 * Usage:
 *   pnpm test:video          → record all flows
 *   pnpm record              → record + merge into .recordings/final/v1.0-<date>.webm
 */
export default defineConfig({
  testDir: './e2e/video',
  outputDir: '../../.recordings/raw',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: '../../.recordings/report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1280, height: 800 },
    // slowMo makes transitions visible in the final video
    launchOptions: { slowMo: 350 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // No webServer block — assumes `pnpm dev` is already running on port 3000.
  // Start it first: cd apps/web && pnpm dev
});

