import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'chromium-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce',
        },
      },
    },
    ...(!process.env.CI || process.env.CI_ALL_BROWSERS === 'true'
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
      },
});
