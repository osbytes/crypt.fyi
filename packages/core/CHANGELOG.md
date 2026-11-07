# @crypt.fyi/core

## 0.1.0

### Minor Changes

- [#164](https://github.com/osbytes/crypt.fyi/pull/164) [`58cc940`](https://github.com/osbytes/crypt.fyi/commit/58cc940afd424e98ce0ca6da2709333bc7b74ce4) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Stop storing verification hashes and delete tokens in plaintext in Redis. Hashes are now stored as a keyed digest bound to the vault ID, and delete tokens are encrypted. Existing entries keep working until they expire. Changing `ENCRYPTION_KEY` now makes all unexpired secrets unreadable, not only those with IP restrictions or webhooks.

- [#159](https://github.com/osbytes/crypt.fyi/pull/159) [`9c5dee0`](https://github.com/osbytes/crypt.fyi/commit/9c5dee0e8fff3f907aa6aa4ec9a1d597a4c0632c) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Redesign the web app with a new design language, a System/Light/Dark theme system with no flash on load, a clearer recipient flow, and new translations for the added copy.

### Patch Changes

- [#162](https://github.com/osbytes/crypt.fyi/pull/162) [`c6a41a4`](https://github.com/osbytes/crypt.fyi/commit/c6a41a4600fc8596cba2cf69913275ca83f9fd5c) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Correct the security copy now that Redis persists data with an AOF: secrets reach disk only in encrypted form, and deleted entries can remain until the log is next compacted.

- [#161](https://github.com/osbytes/crypt.fyi/pull/161) [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Update dependencies to resolve security advisories, including requiring zod 4.6.6 or later (GHSA-mrhx-c7xc-m3w5) and patched seroval and glob versions.

## 0.0.21

## 0.0.20

## 0.0.19

## 0.0.18

## 0.0.17

### Patch Changes

- [`f164f7f`](https://github.com/osbytes/crypt.fyi/commit/f164f7fe2e25872882d15ecf55a6fe330501b70e) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Test the release pipeline: npm publish for core/cli and Chrome Web Store publish for the extension.

## 0.0.16

### Patch Changes

- [#136](https://github.com/osbytes/crypt.fyi/pull/136) [`56d841a`](https://github.com/osbytes/crypt.fyi/commit/56d841a204bd1ecb0f0615951a2d279e93546ccb) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Migrate the monorepo to pnpm with supply-chain install controls, add Changesets versioning, and automate npm + Chrome Web Store releases.
