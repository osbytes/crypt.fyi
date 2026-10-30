---
'@crypt.fyi/server': patch
'@crypt.fyi/web': patch
'@crypt.fyi/extension': patch
---

Upgrade dependencies to resolve open security advisories: fastify, undici, vite, vitest, OpenTelemetry instrumentations (no longer emit `db.user` span attributes), and transitive fast-uri, brace-expansion, js-yaml, handlebars, shell-quote, adm-zip, source-map-js, and @grpc/grpc-js.
