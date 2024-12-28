import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

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
        version: '0.0.1',
        description: 'Securely share encrypted text via crypt.fyi',
        permissions: [
          'contextMenus',
          'storage',
          'clipboardWrite',
          'activeTab',
          'scripting',
          'notifications',
        ],
        optional_permissions: ['notifications'],
        background: {
          service_worker: 'src/background.ts',
          type: 'module',
        },
        icons: {
          '16': 'icon-16.png',
          '32': 'icon-32.png',
          '48': 'icon-48.png',
          '128': 'icon-128.png',
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
