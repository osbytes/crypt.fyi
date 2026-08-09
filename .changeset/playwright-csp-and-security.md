---
'@crypt.fyi/web': patch
---

Add Playwright create/read CSP smoke coverage, include the missing sonner `style-src` hash in nginx CSP, and apply pnpm audit overrides for transitive CVEs. Core unit tests use fast KDF params so CI stays quick.
