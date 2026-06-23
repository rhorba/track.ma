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
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_WS_URL: 'ws://localhost:3001',
    },
  },
});
