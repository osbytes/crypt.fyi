# crypt.fyi Streaming Container Format v1

Status: **Draft** — not yet implemented. Normative reference for the large-file
data path. Key words MUST / SHOULD / MAY follow [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

Companion to [SPECIFICATION.md](../SPECIFICATION.md), which continues to define
the inline path unchanged.

## 1. Scope and routing

Secrets take one of two paths, chosen by plaintext byte length at create time:

| Plaintext size | Path | Encryption | Ciphertext lives in |
| --- | --- | --- | --- |
| ≤ 1 MiB (1048576 B) | Inline (existing) | `ml-kem-768-2`, `ml-kem-768-argon2` | Redis, field `c` |
| > 1 MiB | Streaming (this document) | `ml-kem-768-stream` | Object storage, field `blob` |

The inline path MUST NOT change. Existing links, the CLI, and the browser
extension continue to work with no modification. Clients that cannot produce the
streaming format MUST reject payloads over the threshold rather than fall back.

Both paths share the same URL shape, the same server-side verification hash,
the same burn/TTL/read-count semantics, and the same Lua atomicity guarantees.

## 2. Design constraints

1. **Constant memory.** Neither client nor server may hold the full plaintext or
   ciphertext. Working set MUST be O(frame), not O(file).
2. **No base64 on the payload.** `FileReader.readAsDataURL` and the JSON
   envelope are removed from this path. UTF-16 JS strings cost 2 bytes per
   character; a data URL of a 2 GB file is unrepresentable.
3. **Minimal new cryptography.** Key agreement, password stretching, and
   verification reuse existing audited code paths verbatim. Only the container
   framing and the bulk AEAD are new.
4. **Single pass regardless of password.** The password layer MUST NOT require a
   second pass over the payload.

## 3. Cryptographic construction

### 3.1. Content encryption key

A fresh Content Encryption Key is generated per secret:

```
CEK ← CSPRNG(32)
```

The CEK MUST be generated with a cryptographically secure RNG and MUST NOT be
derived from the URL key, the password, or any other secret input.

### 3.2. Key wrapping

The CEK is wrapped by the **existing, unmodified** encryption functions, applied
to 32 bytes instead of to the payload:

```
wrap₁ = mlkem2.encrypt(base64(CEK), urlKey)              // always
wrap₂ = mlkem_argon2.encrypt(wrap₁, password)            // only when a password is set
wrappedKey = wrap₂ if password else wrap₁
```

`mlkem2.encrypt` and `mlkem_argon2.encrypt` are used exactly as they exist in
`packages/core/src/encryption/`. This preserves the current two-layer model —
both the URL key and the password are required — while moving the expensive
Argon2id work off the payload and onto a 32-byte input.

Measured sizes:

| Value | Length |
| --- | --- |
| `base64(CEK)` | 44 chars |
| `wrap₁` (URL key only) | 1592 chars |
| `wrap₂` (URL key + password) | 3656 chars |

Unwrapping reverses the order: `mlkem_argon2.decrypt` then `mlkem2.decrypt`.

### 3.3. Bulk cipher

Payload frames MUST use **AES-256-GCM via WebCrypto** (`crypto.subtle`), keyed
with the CEK.

The post-quantum property is unaffected: it derives from ML-KEM-768 key
encapsulation in §3.2, not from the bulk AEAD. AES-256 retains 128-bit security
against Grover, equivalent to ChaCha20.

Rationale (measured, 64 MiB, framed at 4 MiB, Node 22 / Apple Silicon):

| Cipher | Throughput | 2 GB |
| --- | --- | --- |
| noble ChaCha20-Poly1305 (pure JS) | 286 MB/s | 7.2 s |
| WebCrypto AES-256-GCM (native) | 5388 MB/s | 0.4 s |

Implementations MUST use the one-shot `crypto.subtle.encrypt` per frame.
WebCrypto exposes no incremental AEAD API; per-frame calls are the streaming
seam.

### 3.4. Compression

Compression MUST be `none` on this path. `zlib:pako` base64-encodes its own
output before encryption, so its 75% gain on high-entropy data is exactly
cancelled by the subsequent 1.33× base64 expansion. Measured on 25 MB of random
bytes: 44.89 MB in 1628 ms with `zlib:pako`, against 44.45 MB in 112 ms with
`none`.

## 4. Container layout

```
+--------------------------------------------------+
|  header prefix  P   (28 + wkLen bytes)           |
+--------------------------------------------------+
|  metadata frame     (metaLen bytes)              |
+--------------------------------------------------+
|  data frame 1       (F + 16 bytes)               |
|  data frame 2       (F + 16 bytes)               |
|  ...                                             |
|  data frame N       (≤ F + 16 bytes)             |
+--------------------------------------------------+
```

### 4.1. Header prefix

All multi-byte integers are big-endian.

| Offset | Size | Field | Value |
| --- | --- | --- | --- |
| 0 | 4 | `magic` | ASCII `CFYI` |
| 4 | 1 | `version` | `0x01` |
| 5 | 1 | `flags` | bit 0: password required; bits 1–7 reserved, MUST be 0 |
| 6 | 1 | `frameSizeLog2` | `22` (4 MiB) |
| 7 | 1 | `reserved` | `0x00` |
| 8 | 4 | `noncePrefix` | random |
| 12 | 4 | `wkLen` | u32, length of `wrappedKey` |
| 16 | `wkLen` | `wrappedKey` | ASCII base64, §3.2 |
| 16+`wkLen` | 4 | `metaLen` | u32 |
| 20+`wkLen` | 8 | `plaintextLen` | u64, total plaintext bytes |

The header prefix `P` is the byte range `[0, 28 + wkLen)`.

```
headerHash = SHA-256(P)                    // 32 bytes
headerTotal = 28 + wkLen + metaLen
```

`headerHash` binds every header field — including `frameSizeLog2`,
`noncePrefix`, `plaintextLen`, and the wrapped key — into every frame's AAD.
Tampering with any of them MUST cause authentication failure on the first frame
decrypted.

### 4.2. Metadata frame

Frame counter `0`, containing AES-256-GCM over the UTF-8 JSON:

```json
{ "name": "<original filename>", "type": "<mime type>", "size": <bytes> }
```

The filename MUST be carried here, encrypted. It MUST NOT appear in the storage
object key, in the Redis record, or in any log.

### 4.3. Data frames

Data frames are counters `1 … N` where `N = ceil(plaintextLen / F)` and
`F = 2^frameSizeLog2`. All frames except the last cover exactly `F` plaintext
bytes.

```
nonce_i = noncePrefix (4 B) ‖ u64BE(i)                      // 12 bytes
AAD_i   = headerHash (32 B) ‖ u64BE(i) ‖ u8(final)          // 41 bytes
frame_i = AES-256-GCM-Encrypt(CEK, nonce_i, AAD_i, plaintext_i)
```

`final` is `0x01` for frame `N` and `0x00` otherwise.

Nonce uniqueness holds because the CEK is fresh per secret (§3.1), so the
counter starts at 0 for each key. This is the standard counter-nonce
construction; the random `noncePrefix` is defence in depth against key reuse
introduced by a future implementation error.

Data frame `i` begins at a deterministic offset, which enables `Range` requests
and per-part retry:

```
offset(i) = headerTotal + (i - 1) × (F + 16)
```

### 4.4. Integrity requirements

A decryptor MUST:

- reject a container whose `magic` or `version` does not match;
- reject a frame whose GCM tag does not verify;
- reject a stream whose final decrypted frame does not carry `final = 0x01`;
- reject a stream whose decrypted plaintext length does not equal
  `plaintextLen`.

The `final` flag and `plaintextLen` are the truncation defences. Without them an
attacker who can cut the stream short produces output that authenticates frame
by frame. Neither is optional.

Reordering and frame substitution are prevented by the counter appearing in both
the nonce and the AAD.

### 4.5. Overhead

16 bytes per frame. At `F = 4 MiB`, a 2 GB payload costs 8192 bytes of tags,
plus a header of roughly 1.6 KB (no password) or 3.7 KB (password) —
under 0.001%.

## 5. Object storage mapping

### 5.1. Key layout

```
<prefix>/YYYY/MM/DD/<blobId>
```

`blobId` MUST be an identifier independent of the vault id, generated by
`generateRandomString(20)`. Reusing the vault id would place a value that
appears in request paths — and therefore in access logs — into the object key,
allowing log-plus-bucket correlation to outlive a burned link.

The object key MUST be recorded in the Redis record rather than derived, so the
layout can change without migration. The key MUST NOT contain the filename.

### 5.2. Multipart alignment

Upload parts MUST be an integer number of frames. With `F = 4 MiB`, a part of 2
frames is 8388640 bytes, satisfying S3's 5 MiB minimum. This alignment lets a
failed part be re-encrypted deterministically and retried in isolation.

| Constraint | Value |
| --- | --- |
| Frame size `F` | 4 MiB |
| Frames per part | 2 |
| Part size | 8388640 B |
| Max parts (S3) | 10000 |
| Max object | 80 GiB |

Buckets MUST have an `AbortIncompleteMultipartUpload` lifecycle rule; abandoned
uploads otherwise accrue storage charges invisibly.

### 5.3. Lifecycle and orphans

Redis key expiry is silent — no notification fires — so explicit deletes cannot
be the only reaping mechanism. Object lifecycle rules MUST be the backstop,
scoped by object tag:

| Tag | Rule |
| --- | --- |
| `retain=false` | Expire after max TTL + margin (8 days) |
| `retain=true` | No expiry |

Deletes issued on burn are an optimisation, not a correctness requirement.

## 6. Vault record changes

`vaultValueSchema` gains an optional `blob` descriptor. `c` becomes optional and
MUST be absent when `blob` is present.

```ts
blob: {
  k: string;   // storage object key
  s: number;   // ciphertext byte length
  n: number;   // data frame count
  r: boolean;  // retain after burn
}
```

All other fields — `h`, `b`, `dt`, `ttl`, `cd`, `ips`, `rc`, `fc`, `wh`, `m` —
are unchanged, as is the Lua script. The script never reads `c`, so burn,
read-count, and failed-attempt atomicity are preserved without modification.

## 7. Transport

### 7.1. Upload

Chunked into separate HTTP requests. A single request MUST NOT carry the whole
payload: Cloudflare caps proxied request bodies at 100 MB, and the server would
otherwise buffer it in memory.

```
POST /vault                    -> { id, dt, uploadId }
PUT  /vault/{id}/parts/{n}     -> part relayed to storage
POST /vault/{id}/complete      -> { }
```

The server MUST stream each part to storage without buffering. Chunk uploads
MUST use a rate-limit bucket separate from the vault API, and MUST be subject to
a per-client total-bytes quota.

Presigned URLs MUST NOT be issued to clients: the storage endpoint is never
exposed.

### 7.2. Download

`GET /vault/{id}?h={hash}` retains its current URL and semantics. When the
record carries `blob`, the server streams the object body as the response after
the hash check passes.

The route MUST be excluded from response compression — the payload is ciphertext
and incompressible. The server SHOULD honour `Range` to allow resumption.

Clients MUST NOT buffer the whole response. Implementations SHOULD use the File
System Access API where available and fall back to a Service Worker streaming
sink; a `Blob` sink MAY be used below 200 MB.

### 7.3. Burn leases

On this path, burn MUST NOT fire before the payload is delivered. A 2 GB
transfer that fails at 95% would otherwise destroy the secret irrecoverably.

Reads on a `blob` record take a lease: the record is marked in-flight with an
expiry, and the burn is applied on successful completion or on lease expiry,
whichever comes first. A second reader arriving while a lease is live MUST be
refused as though the secret were already burned.

## 8. Test vectors

Implementations MUST ship vectors covering:

1. Known CEK, `noncePrefix`, and plaintext → exact container bytes.
2. Round trip at `plaintextLen` = 0, 1, `F-1`, `F`, `F+1`, `3F`.
3. Truncation: removing the final frame MUST fail.
4. Reordering: swapping two frames MUST fail.
5. Header tampering: flipping one bit in each header field MUST fail.
6. Wrong URL key, wrong password, and both — MUST fail.
7. Cross-implementation: a container produced by the browser client MUST decrypt
   in Node and vice versa.

## 9. Open decisions

| Question | Notes |
| --- | --- |
| Retained-blob re-sharing | A retained object is unreadable once the link burns, because the CEK was only ever wrapped to the original URL key. Re-sharing requires key escrow, which breaks zero-knowledge. |
| Egress cost | Relaying both directions puts full payload volume through the API. The alternative — presigned URLs on a first-party domain — conflicts with §7.1. |
| Frame size | 4 MiB balances memory against per-frame overhead. Larger frames reduce tag count; smaller frames improve progress granularity and retry cost. |
| Max object size | 80 GiB falls out of the part math. A lower policy cap is likely wanted. |
