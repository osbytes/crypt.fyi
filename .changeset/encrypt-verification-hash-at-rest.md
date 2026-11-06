---
'@crypt.fyi/core': minor
'@crypt.fyi/server': minor
---

Stop storing verification hashes and delete tokens in plaintext in Redis. Hashes are now stored as a keyed digest bound to the vault ID, and delete tokens are encrypted. Existing entries keep working until they expire. Changing `ENCRYPTION_KEY` now makes all unexpired secrets unreadable, not only those with IP restrictions or webhooks.
