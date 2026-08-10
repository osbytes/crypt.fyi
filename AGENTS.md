# AGENTS.md

Agent instructions for [crypt.fyi](https://crypt.fyi) — a zero-knowledge, end-to-end encrypted secret sharing platform. Prefer this file over tool-specific rule formats.

Human docs: [README.md](./README.md), [CONTRIBUTING.md](./CONTRIBUTING.md), [SECURITY.md](./SECURITY.md), [SPECIFICATION.md](./SPECIFICATION.md).

## Project map

pnpm + Turborepo monorepo (`Node >= 22`, `pnpm >= 11.17` via Corepack).

| Package | Role |
| --- | --- |
| `@crypt.fyi/core` | Shared crypto, client API, i18n |
| `@crypt.fyi/web` | React web client |
| `@crypt.fyi/server` | Fastify API + Redis |
| `@crypt.fyi/cli` | npm CLI |
| `@crypt.fyi/extension` | Chrome extension |

Encryption/decryption and key material live in `@crypt.fyi/core` and must stay client-side. The server stores ciphertext and verification hashes only — never plaintext secrets or raw keys/passwords.

## Commands

```bash
corepack enable
pnpm install
cp .env.example .env   # if needed
pnpm dev               # Redis + turbo dev (API default: http://localhost:4321)
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e          # Playwright product + CSP smoke (create/read/burn, password)
pnpm format / pnpm format:check
pnpm changeset         # version bumps for publishable packages
```

Filter a package: `pnpm --filter @crypt.fyi/<name> <script>`.

## Security (non-negotiable)

- Preserve zero-knowledge: no server-side access to plaintext, encryption keys, or passwords.
- Do not log or surface secrets, keys, passwords, or ciphertext contents in errors, telemetry, or comments.
- Do not weaken CSP. Production CSP (incl. `style-src` hashes) lives in `nginx/nginx.conf`; `packages/web/csp.ts` mirrors it for `vite preview` / e2e. Prefer adding a reported hash over `'unsafe-inline'`.
- Prefer existing Noble-based constructions in `packages/core/src/encryption/`. Do not invent custom crypto; architectural crypto changes need updates to `SPECIFICATION.md` and thorough tests.
- Report vulnerabilities per [SECURITY.md](./SECURITY.md) — never via public issues.

## i18n

Translations live in `@crypt.fyi/core`:

- Locales: `packages/core/src/i18n/locales/`
- Key typings: `packages/core/src/i18n/types.ts`
- Registry: `packages/core/src/i18n/index.ts`

When adding or changing UI copy:

1. Add/update keys in `types.ts`
2. Update **every** locale file (`en`, `es`, `de`, `fr`, `zh`)
3. Register new languages in `index.ts` (`resources` + `supportedLanguages`)

## Coding norms

- TypeScript everywhere; avoid `any`. Match existing Prettier/ESLint setup — do not restate style guides here.
- Prefer readable, complete changes: no TODOs, placeholders, or partial implementations.
- Leave comments that explain *why* (security/protocol rationale, links to docs), not what the code already says.
- Follow existing patterns in the touched package (React/shadcn in web, Fastify in server).
- Update docs when behavior or architecture changes (package READMEs, OpenAPI if API changes, `SPECIFICATION.md` for protocol changes).

## Testing expectations

- Add/extend unit tests for crypto, verification, and security-sensitive logic in core.
- Run relevant `pnpm test` / `pnpm typecheck` / `pnpm lint` for touched packages before finishing.
- After CSP or style-injection changes, run `pnpm test:e2e` and fix `style-src` hash failures in `nginx/nginx.conf` if needed.

## Boundaries

- Do not commit secrets (`.env`, tokens, credentials).
- Do not invent parallel instruction files (`.cursorrules`, duplicated `CLAUDE.md`, etc.); keep this `AGENTS.md` as the source of truth.
- Ask before destructive git operations, force-pushes, or publishing releases.
