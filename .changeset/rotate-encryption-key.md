---
'@crypt.fyi/core': minor
'@crypt.fyi/server': minor
---

Allow rotating the server's `ENCRYPTION_KEY` without losing unexpired secrets. Data encrypted or digested at rest now records which key wrote it, and the new `ENCRYPTION_PREVIOUS_KEYS` setting keeps old keys available for reads. A new `rotate-keys` command re-encrypts existing entries with the new key and reports when the old key can be removed. Core adds `machine.createKeyring` and keyring-based encrypt, decrypt and digest functions, and `machine.isEncrypted` and `machine.isDigest` also recognise the new formats.
