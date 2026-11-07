# @crypt.fyi/extension

## 0.1.0

### Patch Changes

- [#161](https://github.com/osbytes/crypt.fyi/pull/161) [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Update dependencies to resolve security advisories, including requiring zod 4.6.6 or later (GHSA-mrhx-c7xc-m3w5) and patched seroval and glob versions.

- [#165](https://github.com/osbytes/crypt.fyi/pull/165) [`91572c8`](https://github.com/osbytes/crypt.fyi/commit/91572c80cddbc2bee67bbed5d138a502a7b7e21b) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Share design tokens, fonts and theme logic through a new private `@crypt.fyi/theme` package. The extension settings page adopts the redesigned look with a System/Light/Dark control, which also fixes it always rendering dark.

- Updated dependencies [[`58cc940`](https://github.com/osbytes/crypt.fyi/commit/58cc940afd424e98ce0ca6da2709333bc7b74ce4), [`c6a41a4`](https://github.com/osbytes/crypt.fyi/commit/c6a41a4600fc8596cba2cf69913275ca83f9fd5c), [`012b06a`](https://github.com/osbytes/crypt.fyi/commit/012b06a73dfb48f6fee5490ab5cd94446cf11892), [`9c5dee0`](https://github.com/osbytes/crypt.fyi/commit/9c5dee0e8fff3f907aa6aa4ec9a1d597a4c0632c)]:
  - @crypt.fyi/core@0.1.0

## 0.0.21

### Patch Changes

- [#152](https://github.com/osbytes/crypt.fyi/pull/152) [`f9491b6`](https://github.com/osbytes/crypt.fyi/commit/f9491b679988079d9be306b92e583f860c73e00d) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Upgrade dependencies to resolve open security advisories: fastify, undici, vite, vitest, OpenTelemetry instrumentations (no longer emit `db.user` span attributes), and transitive fast-uri, brace-expansion, js-yaml, handlebars, shell-quote, adm-zip, source-map-js, and @grpc/grpc-js.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.21

## 0.0.20

### Patch Changes

- [#144](https://github.com/osbytes/crypt.fyi/pull/144) [`e161e1a`](https://github.com/osbytes/crypt.fyi/commit/e161e1ad01a04e909376d22c98df926be9e4638b) Thanks [@dillonstreator](https://github.com/dillonstreator)! - Add an options page and managed-storage defaults for the browser extension so users and admins can configure create settings without rebuilding.

- Updated dependencies []:
  - @crypt.fyi/core@0.0.20

## 0.0.19

### Patch Changes

- Updated dependencies []:
  - @crypt.fyi/core@0.0.19

## 0.0.18

### Patch Changes

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
