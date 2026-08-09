---
'@crypt.fyi/web': patch
---

Support separate decryption-key delivery: always show combined URL, key-free URL, and decryption key after create; prompt for key and/or password on read when needed; migrate legacy `?key=` links into the URL fragment and warn that the sender should upgrade.
