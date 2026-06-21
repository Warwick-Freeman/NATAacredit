import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Nexus 360 Accreditation UI smoke + navigation tests.
 *
 * Targets local dev by default:
 *   - Frontend (Vite):  http://localhost:5173   (BASE_URL)
 *   - Backend (.NET):   http://localhost:5000    (API_URL)
 *
 * Override either with env vars, e.g. to smoke-test production read-only:
 *   BASE_URL=https://acdem.nexus360.cloud API_URL=https://acdem.nexus360.cloud npx playwright test
 *
 * The `webServer` block auto-starts both dev servers. If you already have
 * `npm run dev` and `dotnet run` running, they are reused (reuseExistingServer).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Auto-start the dev servers unless they're already up.
  // Skip entirely when targeting a remote host (BASE_URL points off-localhost).
  webServer: BASE_URL.includes('localhost')
    ? [
        {
          // The API root returns 404, so probe a real endpoint. It answers 401
          // (unauthenticated), which Playwright accepts as "server is up".
          command: 'dotnet run --project api',
          url: `${API_URL}/api/config`,
          reuseExistingServer: !isCI,
          // Cold `dotnet run` (restore + build) can exceed two minutes.
          timeout: 240_000,
          stdout: 'ignore',
          stderr: 'pipe',
        },
        {
          command: 'npm run dev',
          url: BASE_URL,
          reuseExistingServer: !isCI,
          timeout: 60_000,
          stdout: 'ignore',
          stderr: 'pipe',
        },
      ]
    : undefined,
});
