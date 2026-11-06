---
'@crypt.fyi/core': patch
---

Correct the security copy now that Redis persists data with an AOF: secrets reach disk only in encrypted form, and deleted entries can remain until the log is next compacted.
