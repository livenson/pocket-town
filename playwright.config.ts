import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/pocket-town/`,
    trace: 'retain-on-failure',
  },
  projects: [
    // iPadOS Safari is the strictest target, so phone and tablet run in WebKit.
    { name: 'phone', use: { ...devices['iPhone 15'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 11)'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/pocket-town/`,
    reuseExistingServer: !process.env.CI,
  },
});
