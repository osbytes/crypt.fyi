import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'node:path';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 5173,
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
});
