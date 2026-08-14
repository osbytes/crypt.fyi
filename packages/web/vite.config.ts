import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { loadProductionCsp } from './csp';

const getGitHash = () => {
  if (process.env.VITE_GIT_HASH) {
    return process.env.VITE_GIT_HASH;
  }

  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    console.error('getting git hash failed:', e);
    return '';
  }
};

const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8'));

const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:4321';
// Prefer an explicit override (Playwright sets this) so preview matches nginx.
const previewCsp = process.env.CRYPT_FYI_PREVIEW_CSP ?? loadProductionCsp(apiUrl);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), svgr()],
  server: {
    port: 5173,
  },
  preview: {
    // Smoke/e2e exercises the same CSP string nginx ships, with $api_url resolved.
    headers: {
      'Content-Security-Policy': previewCsp,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // https://github.com/tabler/tabler-icons/issues/1233#issuecomment-2428245119
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  worker: {
    format: 'es',
  },
  define: {
    __GIT_HASH__: JSON.stringify(getGitHash()),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // Keep Playwright specs out of `pnpm test` (vitest); they run via `pnpm test:e2e`.
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
