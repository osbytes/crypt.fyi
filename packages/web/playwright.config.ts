import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProductionCsp } from './csp';

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, '../..');
// Dedicated ports so local `pnpm dev` (API :4321 / Vite :5173) can stay up without
// Playwright attaching to the wrong process or failing to bind.
const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:4322';
const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 4173);
const webOrigin = `http://localhost:${webPort}`;
const apiPort = new URL(apiUrl).port || '4322';
const previewCsp = loadProductionCsp(apiUrl);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: webOrigin,
    locale: 'en-US',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `node "${path.join(repoRoot, 'packages/server/dist/index.js')}"`,
      url: `${apiUrl.replace(/\/$/, '')}/health`,
      // Always spawn our own API so RATE_LIMITER / MAX / PORT cannot be silently ignored.
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
        CORS_ORIGIN: '*',
        PORT: apiPort,
        // Process-local counters: no shared Redis rate-limit keys with unit tests or `pnpm dev`.
        RATE_LIMITER: process.env.RATE_LIMITER ?? 'memory',
        RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? '1000',
      },
    },
    {
      // Rebuild so `import.meta.env.VITE_API_URL` matches the e2e API port/CSP
      // (vite preview only serves already-baked assets).
      command: `pnpm exec vite build && pnpm exec vite preview --host localhost --port ${webPort}`,
      cwd: webRoot,
      url: webOrigin,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        VITE_API_URL: apiUrl,
        CRYPT_FYI_PREVIEW_CSP: previewCsp,
      },
    },
  ],
});
