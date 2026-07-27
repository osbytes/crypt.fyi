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

const releaseTargets = [
  { name: '@crypt.fyi/core', dir: 'packages/core', registry: 'npm' },
  { name: '@crypt.fyi/cli', dir: 'packages/cli', registry: 'npm' },
  { name: '@crypt.fyi/extension', dir: 'packages/extension', registry: 'chrome' },
];

for (const target of releaseTargets) {
  const pkg = readJson(path.join(root, target.dir, 'package.json'));
  const tag = `${pkg.name}@${pkg.version}`;
  const created = ensureGitTag(tag);

  if (target.registry === 'chrome' && created) {
    const publishScript = path.join(root, 'scripts', 'publish-extension.mjs');
    if (!existsSync(publishScript)) {
      throw new Error(`Missing ${publishScript}`);
    }
    console.log(`Publishing ${tag} to the Chrome Web Store…`);
    run('node', [publishScript]);
  }
}

console.log('Release complete.');
