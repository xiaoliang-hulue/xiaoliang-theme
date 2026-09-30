import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  },
  reporter: [['list']],
});
