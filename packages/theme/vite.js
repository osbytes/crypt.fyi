import fs from 'node:fs';

const SCRIPT_PATH = '/theme-init.js';

const readScript = () => fs.readFileSync(new URL('./src/theme-init.js', import.meta.url), 'utf8');

/**
 * Serves the pre-paint theme script from this package. It has to stay a same-origin classic
 * script: CSP forbids inline scripts, and module scripts are deferred until after first paint.
 *
 * @returns {import('vite').Plugin}
 */
export function themeInitScript() {
  return {
    name: 'crypt-fyi-theme-init',
    configureServer(server) {
      server.middlewares.use(SCRIPT_PATH, (_req, res) => {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(readScript());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'theme-init.js', source: readScript() });
    },
    transformIndexHtml: {
      order: 'post',
      handler() {
        // In the body, not the head: the script updates the theme-color meta tag, which must exist.
        return [{ tag: 'script', attrs: { src: SCRIPT_PATH }, injectTo: 'body-prepend' }];
      },
    },
  };
}
