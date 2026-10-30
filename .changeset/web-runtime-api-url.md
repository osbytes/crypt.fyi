---
'@crypt.fyi/web': patch
---

Read the API URL from the container's `API_URL` at runtime via `/config.js` instead of baking `VITE_API_URL` into the bundle, so one web image works with any API.
