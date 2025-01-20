import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

export default defineConfig({
  publicDir: 'icons',
  server: {
    port: 5174,
  },
  plugins: [
    webExtension({
      disableAutoLaunch: true,
      manifest: () => ({
        manifest_version: 3,
        name: 'crypt.fyi',
        version: pkg.version,
        description: 'Securely share encrypted text via crypt.fyi',
        permissions: ['contextMenus', 'clipboardWrite', 'activeTab', 'scripting', 'notifications'],
        background: {
          service_worker: 'src/background.ts',
          type: 'module',
        },
        icons: {
          '16': '16.png',
          '32': '32.png',
          '48': '48.png',
          '128': '128.png',
        },
      }),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
