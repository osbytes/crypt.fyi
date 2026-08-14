import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const managedSchema = fs.readFileSync('managed_schema.json', 'utf8');

export default defineConfig({
  // Relative asset URLs so options HTML under src/options/ resolves JS/CSS in the extension.
  base: './',
  publicDir: 'icons',
  server: {
    port: 5174,
  },
  plugins: [
    tailwindcss(),
    {
      name: 'emit-managed-schema',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'managed_schema.json',
          source: managedSchema,
        });
      },
    },
    {
      // chrome-extension:// pages can fail to load module scripts with crossorigin set
      name: 'strip-html-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '');
      },
    },
    webExtension({
      disableAutoLaunch: true,
      manifest: () => ({
        manifest_version: 3,
        name: 'crypt.fyi',
        version: pkg.version,
        description: 'Securely share encrypted text via crypt.fyi',
        permissions: [
          'contextMenus',
          'clipboardWrite',
          'activeTab',
          'scripting',
          'notifications',
          'storage',
        ],
        background: {
          service_worker: 'src/background.ts',
          type: 'module',
        },
        action: {
          default_title: 'crypt.fyi settings',
          default_icon: {
            '16': '16.png',
            '32': '32.png',
            '48': '48.png',
            '128': '128.png',
          },
        },
        options_ui: {
          page: 'src/options/index.html',
          open_in_tab: true,
        },
        storage: {
          managed_schema: 'managed_schema.json',
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
