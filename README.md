<p align="center">
   <a href="https://crypt.fyi" target="_blank">
   <img src="https://crypt.fyi/logo-light.svg" style="width: 100px;" alt="logo" />
   </a>
</p>

<p align="center">
  <a href="https://crypt.fyi" target="_blank">crypt.fyi</a> - A zero-knowledge, end-to-end encrypted secret sharing platform that enables secure and private transmission of sensitive data.
</p>

<p align="center">
   <a href="https://www.osbytes.io" target="_blank" rel="noopener noreferrer" title="osbytes — open source bytes">
     <img
       src="https://www.osbytes.io/badge.svg"
       alt="osbytes — open source bytes"
       width="24"
       height="24"
     />
  </a>
  <a href="https://github.com/osbytes/crypt.fyi/actions/workflows/ci.yml" target="_blank">
    <img src="https://github.com/osbytes/crypt.fyi/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://securityheaders.com/?q=https://www.crypt.fyi&followRedirects=on" target="_blank">
    <img src="https://img.shields.io/badge/Security%20Headers-A-brightgreen" alt="Security Headers" />
  </a>
  <a href="https://developer.mozilla.org/en-US/observatory/analyze?host=crypt.fyi" target="_blank">
    <img src="https://img.shields.io/mozilla-observatory/grade-score/crypt.fyi" alt="Mozilla HTTP Observatory Grade" />
  </a>
  <a href="https://bestpractices.coreinfrastructure.org/projects/9850" target="_blank">
    <img src="https://bestpractices.coreinfrastructure.org/projects/9850/badge" alt="CII Best Practices" />
  </a>
  <a href="https://github.com/osbytes/crypt.fyi/tree/main/packages/core/src/i18n/locales" target="_blank">
    <img src="https://img.shields.io/badge/i18n-✓-blue?logo=translate" alt="i18n" />
  </a>
  <a href="https://ko-fi.com/osbytes" target="_blank">
    <img src="https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white" alt="Support on Ko-fi" />
  </a>
</p>

## Features

- 🔐 End-to-end encryption using ML-KEM post-quantum cryptography
- 🛡️ Strict Content Security Policy (CSP) to prevent XSS attacks and unauthorized resource loading
- 🛡️ Strict rate limits to mitigate brute-force attacks
- 🤫 Zero-knowledge architecture - server never sees unencrypted data or decryption keys
- 🔥 Burn after reading w/ provisions to prevent erroneous burns from bots or url introspection
- 🔥 Burn after `n` read failures
- ⏰ Automatic expiration (Time-To-Live)
- 🗝️ Password protection
- 📁 File sharing support w/ drag and drop
- 🪝 Webhook notifications for read success, read failure, and burn events
- 🌐 IP/CIDR allow-listing
- 🔢 Read count limits
- 📱 QR code generation
- ⌨️ [CLI](https://www.npmjs.com/package/@crypt.fyi/cli) for interacting with the API
- 🧩 [Chrome Extension](https://chromewebstore.google.com/detail/cryptfyi/hkmbmkjfjfdbpohlllleaacjkacfhald)
- 🐳 Docker images for the api server and web client
- 🌐 Internationalization support for multiple languages
  - Currently supported: [View supported languages](https://github.com/osbytes/crypt.fyi/tree/main/packages/core/src/i18n/locales)
  - Contributions welcome for new translations!

## How It Works

1. Encryption key is generated on the client
1. Password is optionally provided
1. Encryption key and password are used to encrypt the secret
1. Encryption key and password are **hashed** and stored along with the encrypted secret for verification on retrieval - the raw key and password are **never** stored or transmitted on/to the server
1. The unique URL containing the decryption key is generated on the client
1. Share the URL with your recipient and separately the password if specified
1. When accessed, only when the decryption key and password match via server-side verification of the hashes, the encrypted secret is shared and decrypted in the recipient's browser
1. Optionally, the secret is automatically destroyed after being read in an atomic read & delete operation guaranteeing only one person can access the secret
1. If retrieval doesn't happen within the TTL, the secret is automatically destroyed

[RFC](./SPECIFICATION.md)

## API Usage

[OpenAPI Specification](https://api.crypt.fyi/docs)

## Deployment

### Docker

```bash
API_URL=https://{your-domain-here} ENCRYPTION_KEY=$(openssl rand -base64 32) docker compose up --build
```

`ENCRYPTION_KEY` protects verification hashes, delete tokens, IP restrictions and webhook URLs at rest in Redis. Keep it stable across restarts (e.g. in a `.env` file next to `docker-compose.yaml`). Replacing it outright makes all existing secrets unreadable until they expire; to change it without losing any, follow [Rotating `ENCRYPTION_KEY`](#rotating-encryption_key).

#### Rotating `ENCRYPTION_KEY`

The server holds a keyring: `ENCRYPTION_KEY` is the primary key, used for every new write, and `ENCRYPTION_PREVIOUS_KEYS` is a comma-separated list of older keys that are only used to read existing entries. Everything written at rest records which key wrote it, so the server picks the right key on each read.

1. **Generate a new key:** `openssl rand -base64 32`.
2. **Multiple server instances only: make the new key known everywhere first.** Add the new key to `ENCRYPTION_PREVIOUS_KEYS` on every instance and roll them all out. Otherwise an instance that already writes with the new key can produce entries that an instance still on the old configuration can't read. A single instance can skip this step.
3. **Promote the new key.** Set `ENCRYPTION_KEY` to the new key and move the old key to `ENCRYPTION_PREVIOUS_KEYS`, then restart every instance. The startup log line `Loaded encryption keyring` shows how many previous keys each instance loaded.
4. **Re-encrypt existing entries.** With the same environment as the server, run:

   ```bash
   docker compose exec server node packages/server/dist/rotate-keys.js
   ```

   (`pnpm --filter @crypt.fyi/server keys:rotate` outside Docker; add `--dry-run` to report without writing.) It re-encrypts IP restrictions, webhook URLs and delete tokens with the new key, keeping each entry's TTL and never overwriting a concurrent read or burn. It's safe to run repeatedly while the server takes traffic. Verification-hash digests can't be re-keyed, because the server never learns the hash itself, so entries created before step 3 keep needing the old key until they expire. The report's `previousKeysNeededUntil` says when that is (at most the max TTL, 7 days by default).
5. **Retire the old key.** After `previousKeysNeededUntil` has passed, run the command again. Once it reports `"safeToRemovePreviousKeys": true` (no entry or queued webhook depends on a previous key), remove the old key from `ENCRYPTION_PREVIOUS_KEYS` and restart.

If the old key leaked, you can shorten step 5, but removing it before `previousKeysNeededUntil` makes the remaining older secrets unreadable. Entries already re-encrypted in step 4 no longer expose their IP restrictions, webhook URLs or delete tokens to the old key. A non-zero `unreadable` count in the report means an entry was written with a key that is no longer configured; its secret can't be recovered unless you add that key back.

`API_URL` is read when the web container starts, so changing it only needs a restart (`docker compose up -d`), not a rebuild. It must be a plain `http(s)://host[:port][/path]` URL; the container refuses to start otherwise.

A prebuilt API server image (`linux/amd64`, `linux/arm64`) is published to GHCR on every release:

```bash
docker pull ghcr.io/osbytes/crypt.fyi-server:latest
```

It runs with `NODE_ENV=production` and requires `REDIS_URL` and `ENCRYPTION_KEY` (plus `ENCRYPTION_PREVIOUS_KEYS` while [rotating it](#rotating-encryption_key)).

The web client image is not published to GHCR yet; build it with `docker compose` as above.

#### Redis persistence

The compose file stores Redis data in the `redis_data` volume using an append-only file (AOF) that is synced to disk before each write is acknowledged, so secrets and queued webhooks survive restarts and crashes. A secret that was burned stays burned, even after a crash. RDB snapshots stay off because restoring an older snapshot could bring a burned secret back. See the [specification](./SPECIFICATION.md) for the requirements.

What this means for operators:

- **The disk holds sensitive data.** The volume contains ciphertext, keyed digests of verification hashes and encrypted delete tokens, but never plaintext or decryption keys. The digests and tokens rely on `ENCRYPTION_KEY`, so keep that key off this disk where you can. Once a secret is deleted, the server never returns it, even if its ciphertext remains in the AOF until Redis next compacts it. Encrypt the disk.
- **Don't back up the volume.** Restoring a backup can bring back burned secrets.
- **Writes are slower** than without persistence, because each one waits for the disk.
- **`docker compose down -v` deletes the volume** and every unexpired secret with it.

To run without persistence, set `--appendonly no` and remove the volume. A Redis restart then drops all unexpired secrets and queued webhooks. If you run Redis any other way (the GHCR image with your own Redis, a managed service, a hosting platform), apply these settings yourself: by default Redis takes snapshots and doesn't use AOF.

##### Upgrading from RDB snapshots

Deployments from before this change store data in a `dump.rdb` snapshot, which Redis ignores once AOF is on. **Upgrading without these steps loses all unexpired secrets**, and the old snapshot stays on disk. Before pulling the new compose file, turn on AOF in the running Redis:

```bash
docker compose exec redis redis-cli config set appendonly yes
```

Wait until this shows `aof_rewrite_in_progress:0` and `aof_last_bgrewrite_status:ok`:

```bash
docker compose exec redis redis-cli info persistence
```

Then pull the new compose file and restart:

```bash
docker compose up -d
```

Once you've confirmed existing secrets still open, delete the old snapshot:

```bash
docker compose exec redis rm /data/dump.rdb
```

### Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/Pmkrsc?referralCode=ToZEjF&utm_medium=integration&utm_source=template&utm_campaign=generic)

## Development

1. Clone the repository
2. Enable Corepack (uses the `packageManager` field → pnpm):
   ```bash
   npm install -g corepack   # Node 25+ no longer bundles it
   corepack enable
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Set up environment variables (see `.env.example`)
5. Start the development server:
   ```bash
   pnpm dev
   ```

### Releasing packages

Publishable packages: `@crypt.fyi/core` and `@crypt.fyi/cli` (npm), plus the Chrome extension.

1. Record changes: `pnpm changeset`
2. Merge to `main` — the Release workflow opens a Version Packages PR (or publishes when that PR is merged)
3. Required GitHub secrets for publishing:
   - `NPM_TOKEN`
   - `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`, `CHROME_PUBLISHER_ID`

## Technical Stack

- [Noble cryptography](https://paulmillr.com/noble/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Node.js](https://nodejs.org/en)
- [Fastify](https://fastify.dev/)
- [Redis](https://redis.io/)
- [OpenTelemetry](https://opentelemetry.io/)

## Known Issues & Development Considerations

### Content Security Policy

- Production CSP (including `style-src` hashes for sonner/Radix inline styles) lives in `nginx/nginx.conf`
- `vite preview` applies that same policy via `packages/web/csp.ts` so local/CI match production
- `pnpm test:e2e` runs Playwright against `vite preview` under that CSP (default create→read→burn, password unlock). It fails on `style-src` / `connect-src` violations; other console warnings/errors and non-style CSP noise (e.g. `script-src` eval fallback notes) are reported as non-blocking annotations
- The e2e API uses an in-memory rate limiter and dedicated ports (`:4322` API / `:4173` preview by default) so local `pnpm dev` and shared Redis rate-limit keys cannot poison the suite. Playwright rebuilds the web client with that API URL before preview so CSP `connect-src` matches the baked client config.
- When a test fails on style-src, add the reported hash to `nginx/nginx.conf` (do not weaken to `'unsafe-inline'`)
- Reference: [sonner#449](https://github.com/emilkowalski/sonner/issues/449)

### Development Environment

- Ensure Redis is running locally when developing the server
- The web client expects the API to be available at `http://localhost:4321` by default
- CSP headers in development may differ from production configuration

### Security Considerations

- Always test encryption/decryption flows thoroughly when making changes
- Ensure no sensitive data is logged or exposed in error messages
- Maintain strict CSP headers to prevent XSS vulnerabilities
- Keep dependencies updated for security patches

## Contributing

Contributions are welcome! Please feel free to submit an [Issue](https://github.com/osbytes/crypt.fyi/issues) or [Pull Request](https://github.com/osbytes/crypt.fyi/pulls) on [GitHub](https://github.com/osbytes/crypt.fyi).

## Support

crypt.fyi is free to use. If it's useful to you, you can help fund hosting and development on [Ko-fi](https://ko-fi.com/osbytes).
