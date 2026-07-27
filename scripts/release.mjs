import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', cwd: root, ...options });
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function tagExists(tag) {
  try {
    execSync(`git rev-parse -q --verify "refs/tags/${tag}"`, {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function ensureGitTag(tag) {
  if (tagExists(tag)) {
    console.log(`Tag already exists: ${tag}`);
    return false;
  }
  run('git', ['tag', '-a', tag, '-m', tag]);
  console.log(`Created tag: ${tag}`);
  return true;
}

function isTruthy(value) {
  return value === '1' || value === 'true';
}

// Manual workflow runs should always attempt Chrome publish for the current
// package version. A git tag only means GitHub tagged the release — it does
// not mean the Chrome Web Store received the build.
const publishChromeAlways = isTruthy(process.env.PUBLISH_CHROME);

const releaseTargets = [
  { name: '@crypt.fyi/core', dir: 'packages/core', registry: 'npm' },
  { name: '@crypt.fyi/cli', dir: 'packages/cli', registry: 'npm' },
  { name: '@crypt.fyi/extension', dir: 'packages/extension', registry: 'chrome' },
];

// Snapshot before `changeset publish`, which also creates tags for private packages.
const pendingChromeTags = new Set();
for (const target of releaseTargets) {
  if (target.registry !== 'chrome') continue;
  const pkg = readJson(path.join(root, target.dir, 'package.json'));
  const tag = `${pkg.name}@${pkg.version}`;
  if (publishChromeAlways || !tagExists(tag)) {
    pendingChromeTags.add(tag);
  }
}

if (publishChromeAlways) {
  console.log('PUBLISH_CHROME set — publishing current extension version to the Chrome Web Store.');
}

console.log('Building publishable packages…');
run('pnpm', [
  'exec',
  'turbo',
  'build',
  '--filter=@crypt.fyi/core',
  '--filter=@crypt.fyi/cli',
  '--filter=@crypt.fyi/extension',
]);

console.log('Publishing npm packages via changesets…');
run('pnpm', ['exec', 'changeset', 'publish']);

for (const target of releaseTargets) {
  const pkg = readJson(path.join(root, target.dir, 'package.json'));
  const tag = `${pkg.name}@${pkg.version}`;
  ensureGitTag(tag);

  if (target.registry === 'chrome' && pendingChromeTags.has(tag)) {
    const publishScript = path.join(root, 'scripts', 'publish-extension.mjs');
    if (!existsSync(publishScript)) {
      throw new Error(`Missing ${publishScript}`);
    }
    console.log(`Publishing ${tag} to the Chrome Web Store…`);
    run('node', [publishScript], {
      env: {
        ...process.env,
        // Fail closed in CI when we intentionally scheduled a Chrome publish.
        REQUIRE_CHROME_PUBLISH: '1',
      },
    });
  }
}

console.log('Release complete.');
