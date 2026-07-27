import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionDir = path.join(root, 'packages', 'extension');
const distDir = path.join(extensionDir, 'dist');

// chrome-webstore-upload-cli@4 reads CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN / PUBLISHER_ID from env.
// We accept CHROME_* names in CI and map them for the CLI.
const envMap = {
  CLIENT_ID: process.env.CHROME_CLIENT_ID || process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CHROME_CLIENT_SECRET || process.env.CLIENT_SECRET,
  REFRESH_TOKEN: process.env.CHROME_REFRESH_TOKEN || process.env.REFRESH_TOKEN,
  PUBLISHER_ID: process.env.CHROME_PUBLISHER_ID || process.env.PUBLISHER_ID,
  EXTENSION_ID: process.env.CHROME_EXTENSION_ID || process.env.EXTENSION_ID,
};

const missing = Object.entries(envMap)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  const message = `Chrome Web Store publish missing secrets: ${missing
    .map((key) => `CHROME_${key}`)
    .join(', ')}`;

  // Release intentionally scheduled a Chrome publish — fail instead of silently skipping.
  if (process.env.REQUIRE_CHROME_PUBLISH === '1' || process.env.REQUIRE_CHROME_PUBLISH === 'true') {
    console.error(message);
    process.exit(1);
  }

  console.log(`Skipping ${message}`);
  process.exit(0);
}

// Always rebuild so standalone / force republish uploads match package.json version.
// Use turbo so workspace deps (e.g. @crypt.fyi/core) build first via dependsOn: ["^build"].
console.log('Building extension and dependencies…');
execFileSync('pnpm', ['exec', 'turbo', 'build', '--filter=@crypt.fyi/extension'], {
  stdio: 'inherit',
  cwd: root,
});

if (!existsSync(distDir)) {
  throw new Error(`Extension dist not found at ${distDir}`);
}

const pkg = JSON.parse(readFileSync(path.join(extensionDir, 'package.json'), 'utf8'));
console.log(`Uploading @crypt.fyi/extension@${pkg.version} to Chrome Web Store…`);

const cliEnv = {
  ...process.env,
  CLIENT_ID: envMap.CLIENT_ID,
  CLIENT_SECRET: envMap.CLIENT_SECRET,
  REFRESH_TOKEN: envMap.REFRESH_TOKEN,
  PUBLISHER_ID: envMap.PUBLISHER_ID,
  EXTENSION_ID: envMap.EXTENSION_ID,
};

// Upload then publish (v4 no longer uses --client-* flags / --auto-publish).
execFileSync(
  'pnpm',
  [
    'exec',
    'chrome-webstore-upload',
    'upload',
    '--source',
    distDir,
    '--extension-id',
    envMap.EXTENSION_ID,
  ],
  { stdio: 'inherit', cwd: root, env: cliEnv },
);

execFileSync(
  'pnpm',
  ['exec', 'chrome-webstore-upload', 'publish', '--extension-id', envMap.EXTENSION_ID],
  { stdio: 'inherit', cwd: root, env: cliEnv },
);

console.log('Chrome Web Store upload + publish complete.');
