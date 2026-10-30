import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

// Chrome Web Store and GHCR publishing run as separate jobs in release.yml so a
// store-side rejection cannot fail the npm release or skip the server image.
const releaseTargets = [
  { name: '@crypt.fyi/core', dir: 'packages/core' },
  { name: '@crypt.fyi/cli', dir: 'packages/cli' },
  { name: '@crypt.fyi/extension', dir: 'packages/extension' },
];

console.log('Building publishable packages…');
run('pnpm', ['exec', 'turbo', 'build', '--filter=@crypt.fyi/core', '--filter=@crypt.fyi/cli']);

console.log('Publishing npm packages via changesets…');
run('pnpm', ['exec', 'changeset', 'publish']);

for (const target of releaseTargets) {
  const pkg = readJson(path.join(root, target.dir, 'package.json'));
  ensureGitTag(`${pkg.name}@${pkg.version}`);
}

console.log('Release complete.');
