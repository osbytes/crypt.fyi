# @crypt.fyi/web

## 0.0.20

### Patch Changes

- [#146](https://github.com/osbytes/crypt.fyi/pull/146) [`1298f4b`](https://github.com/osbytes/crypt.fyi/commit/1298f4be1fda69bf7bdefc63bfc58d1a34a71b68) Thanks [@snowyukitty](https://github.com/snowyukitty)! - Restore recoverable credential and request retry states in the secret view flow.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.20

## 0.0.19

### Patch Changes

- [#142](https://github.com/osbytes/crypt.fyi/pull/142) [`14a33f1`](https://github.com/osbytes/crypt.fyi/commit/14a33f14d9b447a295303ac3817b6c7b65f08e65) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Add Playwright create/read CSP smoke coverage, include the missing sonner `style-src` hash in nginx CSP, and apply pnpm audit overrides for transitive CVEs. Core unit tests use fast KDF params so CI stays quick.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.19

## 0.0.18

### Patch Changes

- [#139](https://github.com/osbytes/crypt.fyi/pull/139) [`2dbb6c5`](https://github.com/osbytes/crypt.fyi/commit/2dbb6c50bbc18a0c69f5ae47d81d0335b2f8d100) Thanks [@snowyukitty](https://github.com/snowyukitty)! - Support separate decryption-key delivery: always show combined URL, key-free URL, and decryption key after create; prompt for key and/or password on read when needed; migrate legacy `?key=` links into the URL fragment and warn that the sender should upgrade.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.18

## 0.0.17

### Patch Changes

- [`f164f7f`](https://github.com/osbytes/crypt.fyi/commit/f164f7fe2e25872882d15ecf55a6fe330501b70e) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Test the release pipeline: npm publish for core/cli and Chrome Web Store publish for the extension.

- Updated dependencies [[`f164f7f`](https://github.com/osbytes/crypt.fyi/commit/f164f7fe2e25872882d15ecf55a6fe330501b70e)]:
  - @crypt.fyi/core@0.0.17

## 0.0.16

### Patch Changes

- [#136](https://github.com/osbytes/crypt.fyi/pull/136) [`56d841a`](https://github.com/osbytes/crypt.fyi/commit/56d841a204bd1ecb0f0615951a2d279e93546ccb) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Migrate the monorepo to pnpm with supply-chain install controls, add Changesets versioning, and automate npm + Chrome Web Store releases.

- Updated dependencies [[`56d841a`](https://github.com/osbytes/crypt.fyi/commit/56d841a204bd1ecb0f0615951a2d279e93546ccb)]:
  - @crypt.fyi/core@0.0.16
