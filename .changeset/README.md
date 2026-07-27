# Changesets

This folder stores changeset files that describe package version bumps.

## Workflow

1. After making a releasable change, run:

```bash
pnpm changeset
```

2. Commit the generated markdown file under `.changeset/`.

3. On merge to `main`, the Release workflow either:
   - opens a **Version Packages** PR, or
   - publishes `@crypt.fyi/core` + `@crypt.fyi/cli` to npm, tags packages, and uploads the Chrome extension when credentials are configured.

See `scripts/release.mjs` for the publish + tagging entrypoint.
