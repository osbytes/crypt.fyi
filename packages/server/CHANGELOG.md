# @crypt.fyi/server

## 0.1.0

### Minor Changes

- [#164](https://github.com/osbytes/crypt.fyi/pull/164) [`58cc940`](https://github.com/osbytes/crypt.fyi/commit/58cc940afd424e98ce0ca6da2709333bc7b74ce4) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Stop storing verification hashes and delete tokens in plaintext in Redis. Hashes are now stored as a keyed digest bound to the vault ID, and delete tokens are encrypted. Existing entries keep working until they expire. Changing `ENCRYPTION_KEY` now makes all unexpired secrets unreadable, not only those with IP restrictions or webhooks.

### Patch Changes

- [#161](https://github.com/osbytes/crypt.fyi/pull/161) [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Update dependencies to resolve security advisories, including requiring zod 4.6.6 or later (GHSA-mrhx-c7xc-m3w5) and patched seroval and glob versions.

- [#163](https://github.com/osbytes/crypt.fyi/pull/163) [`756bd88`](https://github.com/osbytes/crypt.fyi/commit/756bd88186bced5fa8a1cdf4c6dfc7d48f8cd379) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Upgrade `@fastify/swagger-ui` to v6, which depends on the patched `@fastify/static` 10 line directly.

## 0.0.21

### Patch Changes

- [#152](https://github.com/osbytes/crypt.fyi/pull/152) [`f9491b6`](https://github.com/osbytes/crypt.fyi/commit/f9491b679988079d9be306b92e583f860c73e00d) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Upgrade dependencies to resolve open security advisories: fastify, undici, vite, vitest, OpenTelemetry instrumentations (no longer emit `db.user` span attributes), and transitive fast-uri, brace-expansion, js-yaml, handlebars, shell-quote, adm-zip, source-map-js, and @grpc/grpc-js.

## 0.0.20

## 0.0.19

## 0.0.18

## 0.0.17

### Patch Changes

- [`f164f7f`](https://github.com/osbytes/crypt.fyi/commit/f164f7fe2e25872882d15ecf55a6fe330501b70e) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Test the release pipeline: npm publish for core/cli and Chrome Web Store publish for the extension.

## 0.0.16

### Patch Changes

- [#136](https://github.com/osbytes/crypt.fyi/pull/136) [`56d841a`](https://github.com/osbytes/crypt.fyi/commit/56d841a204bd1ecb0f0615951a2d279e93546ccb) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Migrate the monorepo to pnpm with supply-chain install controls, add Changesets versioning, and automate npm + Chrome Web Store releases.
