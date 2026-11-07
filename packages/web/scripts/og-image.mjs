/**
 * Renders public/og.png, the social share card linked from index.html.
 *
 *   pnpm --filter @crypt.fyi/web og:image
 *
 * Re-run after changing the landing copy, logo or theme tokens so link previews match the
 * site. Colors mirror the dark theme in packages/theme/src/tokens.css, fonts come from the
 * theme package and the copy comes from the English locale in @crypt.fyi/core.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;

const webDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeRequire = createRequire(resolve(webDir, '../theme/package.json'));
const font = (pkg, file) =>
  pathToFileURL(themeRequire.resolve(`@fontsource-variable/${pkg}/files/${file}`)).href;

// Kept in step with landing.title / landing.subtitle / landing.demo in locales/en.ts and the
// demo values in src/pages/Landing.tsx.
const copy = {
  badge: 'Open source · self-hostable',
  title: 'Open-Source Zero-Knowledge Secret Sharing',
  subtitle: 'Encrypt in your browser. Share once. Gone forever.',
  detail: 'Post-quantum end-to-end encryption. Our servers never see your secrets.',
  browser: 'In your browser',
  server: 'On our server',
  afterRead: 'After it is read',
  nothing: 'nothing',
  burned: 'Burned',
  plaintext: 'API_TOKEN=demo-not-a-real-token',
  ciphertext: '9fK2xQ7vLp0tRz4mWb8sYc1NeH6uJd3AoG5iTq…',
};

const logo = readFileSync(resolve(webDir, 'public/logo-light.svg'), 'utf8')
  .replace(/stroke="white"/g, 'stroke="currentColor" fill="currentColor"')
  .replace(/width="370" height="198"/, 'width="74" height="40"');

const flame =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z"/></svg>';

const html = /* html */ `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face { font-family: 'Space Grotesk'; font-weight: 300 700; src: url('${font('space-grotesk', 'space-grotesk-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Inter'; font-weight: 100 900; src: url('${font('inter', 'inter-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; src: url('${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}') format('woff2'); }
  :root {
    --background: #0e0f12; --foreground: #eceef1; --card: #16181c; --muted: #0a0b0d;
    --muted-foreground: #a0a6b0; --border: #2a2e34;
    --ember: #ff8a5c; --ember-tint: #2b1a13; --sealed: #4fd1ae; --sealed-tint: #10261f;
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
  body {
    background:
      radial-gradient(ellipse 60% 70% at 85% 50%, rgb(79 209 174 / 7%), transparent 70%),
      var(--background);
    color: var(--foreground);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    padding: 56px 72px 52px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .brand { display: flex; align-items: center; gap: 16px; font-family: 'Space Grotesk'; font-weight: 600; font-size: 30px; letter-spacing: -0.02em; }
  .brand svg { display: block; }
  main { display: grid; grid-template-columns: 1fr 420px; gap: 52px; align-items: center; }
  .pill { display: inline-flex; align-items: center; gap: 7px; border: 1px solid; border-radius: 999px; padding: 6px 14px; font-size: 16px; font-weight: 600; }
  .sealed { color: var(--sealed); background: var(--sealed-tint); border-color: rgb(79 209 174 / 30%); }
  .ember { color: var(--ember); background: var(--ember-tint); border-color: rgb(255 138 92 / 30%); font-size: 14px; padding: 5px 12px; }
  h1 { font-family: 'Space Grotesk'; font-weight: 600; font-size: 54px; line-height: 1.06; letter-spacing: -0.03em; margin: 20px 0 18px; }
  .sub { font-size: 23px; line-height: 1.4; color: var(--foreground); }
  .detail { font-size: 19px; line-height: 1.45; color: var(--muted-foreground); margin-top: 8px; }
  .card { border: 1px solid var(--border); border-radius: 16px; background: var(--card); overflow: hidden;
    box-shadow: 0 1px 2px rgb(0 0 0 / 40%), 0 24px 48px -16px rgb(0 0 0 / 70%); }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 22px 26px; }
  .row + .row { border-top: 1px solid var(--border); }
  .row.sunken { background: var(--muted); }
  .label { font-family: 'JetBrains Mono'; font-size: 14px; color: var(--muted-foreground); margin-bottom: 8px; }
  .value { font-family: 'JetBrains Mono'; font-size: 15px; word-break: break-all; }
  .value.dim { color: var(--muted-foreground); }
  footer { display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 18px; color: var(--muted-foreground); }
</style>
</head>
<body>
  <div class="brand">${logo}<span>crypt.fyi</span></div>
  <main>
    <div>
      <span class="pill sealed">${copy.badge}</span>
      <h1>${copy.title}</h1>
      <p class="sub">${copy.subtitle}</p>
      <p class="detail">${copy.detail}</p>
    </div>
    <div class="card">
      <div class="row"><div><p class="label">${copy.browser}</p><p class="value">${copy.plaintext}</p></div></div>
      <div class="row sunken"><div><p class="label">${copy.server}</p><p class="value dim">${copy.ciphertext}</p></div></div>
      <div class="row"><div><p class="label">${copy.afterRead}</p><p class="value dim">${copy.nothing}</p></div><span class="pill ember">${flame}${copy.burned}</span></div>
    </div>
  </main>
  <footer><span>ML-KEM-768 · ChaCha20-Poly1305 · burn after reading</span></footer>
</body>
</html>`;

// Loaded from a file rather than setContent so the file:// font URLs are same-origin.
const tmp = mkdtempSync(join(tmpdir(), 'og-image-'));
const htmlPath = join(tmp, 'og.html');
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const out = resolve(webDir, 'public/og.png');
  await page.screenshot({ path: out, type: 'png' });
  console.log(`Wrote ${out} (${WIDTH}x${HEIGHT})`);
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
