# @crypt.fyi/web

## 0.1.1

### Patch Changes

- [#166](https://github.com/osbytes/crypt.fyi/pull/166) [`60fd59f`](https://github.com/osbytes/crypt.fyi/commit/60fd59f2af031e2c7bfee01ce097141cd598ee3c) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Add Ko-fi support links to the web app header, footer, landing page, About page and post-create screen, with translations for the new copy.

- Updated dependencies [[`60fd59f`](https://github.com/osbytes/crypt.fyi/commit/60fd59f2af031e2c7bfee01ce097141cd598ee3c)]:
  - @crypt.fyi/core@0.1.1

## 0.1.0

### Minor Changes

- [#159](https://github.com/osbytes/crypt.fyi/pull/159) [`9c5dee0`](https://github.com/osbytes/crypt.fyi/commit/9c5dee0e8fff3f907aa6aa4ec9a1d597a4c0632c) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Redesign the web app with a new design language, a System/Light/Dark theme system with no flash on load, a clearer recipient flow, and new translations for the added copy.

### Patch Changes

- [#161](https://github.com/osbytes/crypt.fyi/pull/161) [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Update dependencies to resolve security advisories, including requiring zod 4.6.6 or later (GHSA-mrhx-c7xc-m3w5) and patched seroval and glob versions.

- [#165](https://github.com/osbytes/crypt.fyi/pull/165) [`91572c8`](https://github.com/osbytes/crypt.fyi/commit/91572c80cddbc2bee67bbed5d138a502a7b7e21b) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Share design tokens, fonts and theme logic through a new private `@crypt.fyi/theme` package. The extension settings page adopts the redesigned look with a System/Light/Dark control, which also fixes it always rendering dark.

- Updated dependencies [[`58cc940`](https://github.com/osbytes/crypt.fyi/commit/58cc940afd424e98ce0ca6da2709333bc7b74ce4), [`c6a41a4`](https://github.com/osbytes/crypt.fyi/commit/c6a41a4600fc8596cba2cf69913275ca83f9fd5c), [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892), [`9c5dee0`](https://github.com/osbytes/crypt.fyi/commit/9c5dee0e8fff3f907aa6aa4ec9a1d597a4c0632c)]:
  - @crypt.fyi/core@0.1.0

## 0.0.21

### Patch Changes

- [#152](https://github.com/osbytes/crypt.fyi/pull/152) [`f9491b6`](https://github.com/osbytes/crypt.fyi/commit/f9491b679988079d9be306b92e583f860c73e00d) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Upgrade dependencies to resolve open security advisories: fastify, undici, vite, vitest, OpenTelemetry instrumentations (no longer emit `db.user` span attributes), and transitive fast-uri, brace-expansion, js-yaml, handlebars, shell-quote, adm-zip, source-map-js, and @grpc/grpc-js.

- [#155](https://github.com/osbytes/crypt.fyi/pull/155) [`d599040`](https://github.com/osbytes/crypt.fyi/commit/d5990404f827ae2d4b5cc1c88771ade0b3c3c099) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Read the API URL from the container's `API_URL` at runtime via `/config.js` instead of baking `VITE_API_URL` into the bundle, so one web image works with any API.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.21

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
