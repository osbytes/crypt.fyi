# Release Process

This document describes the automated release process for crypt.fyi.

## Overview

The release process is fully automated through scripts and GitHub Actions:

1. **Local validation and tagging**: Run the release script locally to validate, version, and create a git tag
2. **Automated publishing**: When the GitHub release is published, GitHub Actions automatically publishes to npm and Chrome Web Store

## Prerequisites

### Required Tools

- **Node.js** 22.x or higher
- **Yarn** 4.6.0 or higher
- **Git** with remote access to the repository
- **GitHub CLI** (`gh`) - for creating GitHub releases (optional but recommended)
  - Install: `brew install gh` (macOS) or see https://cli.github.com/
  - Authenticate: `gh auth login`
- **LLM CLI** (optional) - for AI-generated changelogs
  - Install: `pip install llm`
  - See: https://llm.datasette.io/

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings for automated publishing:

#### For npm Publishing

- `NPM_TOKEN` - npm authentication token with publish permissions
  - Generate at: https://www.npmjs.com/settings/[username]/tokens
  - Use "Automation" token type

#### For Chrome Web Store Publishing

- `CHROME_EXTENSION_ID` - Your extension's ID from the Chrome Web Store
- `CHROME_CLIENT_ID` - OAuth2 client ID
- `CHROME_CLIENT_SECRET` - OAuth2 client secret
- `CHROME_REFRESH_TOKEN` - OAuth2 refresh token

To get Chrome Web Store credentials:
1. Go to https://console.cloud.google.com/
2. Create a project and enable the Chrome Web Store API
3. Create OAuth2 credentials
4. Use the Chrome Web Store API to get a refresh token

See: https://developer.chrome.com/docs/webstore/using_webstore_api/

## Release Scripts

### Available Commands

```bash
# Interactive release (will prompt for version type)
yarn release

# Non-interactive release with specific version bump
yarn release:major  # 1.0.0 -> 2.0.0
yarn release:minor  # 1.0.0 -> 1.1.0
yarn release:patch  # 1.0.0 -> 1.0.1

# Dry run (preview what would happen)
yarn release:dry-run

# Validate without releasing
yarn validate

# Generate changelog only
yarn changelog
```

### Release Process Steps

When you run `yarn release`, the script will:

1. **Check git status** - Ensures working directory is clean
2. **Run validation** - Executes format, typecheck, lint, build, and test
3. **Generate changelog** - Creates changelog from commits since last tag
4. **Prompt for version** - Asks you to choose major/minor/patch (unless specified)
5. **Update versions** - Updates all `package.json` and `manifest.json` files
6. **Commit changes** - Commits version updates with message `chore: release vX.Y.Z`
7. **Create tag** - Creates git tag `vX.Y.Z`
8. **Push to remote** - Pushes commits and tags to GitHub
9. **Create draft release** - Creates a draft GitHub release with the changelog

### What Happens Next

After the draft release is created:

1. **Review the release** on GitHub
2. **Edit if needed** - Adjust the changelog, add notes, etc.
3. **Publish the release** - Click "Publish release" button

When you publish the release, GitHub Actions automatically:

- Builds all packages
- Runs tests
- Publishes to npm (for public packages)
- Publishes to Chrome Web Store
- Attaches extension zip to the release

## Manual Steps (if needed)

### If GitHub CLI is not available

If `gh` is not installed, the script will skip creating the GitHub release. You can create it manually:

1. Go to: https://github.com/[org]/[repo]/releases/new
2. Select the tag created by the script (e.g., `v1.2.3`)
3. Paste the changelog as the release description
4. Mark as draft
5. Publish when ready

### If validation fails

If any validation step fails:

```bash
# Run specific checks
yarn format:check  # Check code formatting
yarn typecheck     # Check TypeScript types
yarn lint          # Run linting
yarn build         # Build all packages
yarn test          # Run tests

# Fix formatting automatically
yarn format
```

### Skip validation (not recommended)

```bash
./scripts/release.sh --skip-validation
```

### Skip git checks (use with caution)

```bash
./scripts/release.sh --skip-git-check
```

## Changelog Generation

The changelog is automatically generated from git commits since the last tag.

### With LLM (recommended)

If you have the `llm` CLI tool installed, the script will use AI to:

- Categorize commits into sections (Features, Bug Fixes, etc.)
- Generate clear, user-friendly descriptions
- Filter out non-user-facing changes
- Group related changes

### Without LLM

Falls back to a simple conventional changelog format listing all commits.

### Customize LLM model

```bash
LLM_MODEL=claude-3.5-sonnet yarn changelog
```

## Version Synchronization

All packages in the monorepo share the same version number. When you release:

- All `packages/*/package.json` files are updated
- `packages/extension/manifest.json` is updated (if exists)
- `packages/web/public/manifest.json` is updated (if exists)

## Troubleshooting

### "No previous tags found"

This is expected for the first release. The script will generate a changelog from all commits.

### "Git working directory is not clean"

Commit or stash your changes before releasing:

```bash
git status
git add .
git commit -m "your changes"
# or
git stash
```

### "Failed to generate changelog"

Check if commits exist since the last tag:

```bash
git log $(git describe --tags --abbrev=0)..HEAD
```

### "gh: command not found"

Install GitHub CLI:

```bash
# macOS
brew install gh

# Or download from https://cli.github.com/
```

### Release workflow not running

Make sure you **published** the release, not just created a draft. The workflow only runs when a release is published.

### npm publish fails

- Check that `NPM_TOKEN` secret is set correctly
- Verify the token has publish permissions
- Check that package names are available on npm
- For scoped packages (e.g., `@crypt.fyi/core`), ensure they're public or you have access

### Chrome Web Store publish fails

- Verify all four secrets are set correctly
- Check that the extension ID matches your extension
- Ensure the refresh token hasn't expired
- Test credentials with Chrome Web Store API directly

## Development Tips

### Test the release script

Always test with dry run first:

```bash
yarn release:dry-run
```

### Test locally without pushing

```bash
# Run validation only
yarn validate

# Generate changelog only
yarn changelog

# Release with skip flags
./scripts/release.sh --skip-validation --dry-run
```

### Rollback a release

If you need to rollback:

```bash
# Delete the tag locally
git tag -d v1.2.3

# Delete the tag remotely
git push origin :refs/tags/v1.2.3

# Delete the GitHub release
gh release delete v1.2.3

# Revert the version commit
git revert HEAD
git push
```

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:
- Format check
- Build
- Lint
- Type check
- Test

### Release Workflow (`.github/workflows/release.yml`)

Runs when a GitHub release is published:
- Install dependencies
- Build packages
- Run tests
- Publish to Chrome Web Store
- Publish to npm
- Upload extension zip to release

## Support

For issues with the release process:
- Check the GitHub Actions logs
- Review script output for errors
- Ensure all prerequisites are met
- Verify secrets are configured correctly
