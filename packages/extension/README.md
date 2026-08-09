# Crypt.fyi Browser Extension

This browser extension allows you to quickly encrypt and share text selections using crypt.fyi.

## Features

- Right-click context menu integration
- Secure encryption using crypt.fyi's encryption standards
- Automatic clipboard copying of encrypted URLs
- Desktop notifications for successful encryption and errors
- Options page for default create settings (endpoints, TTL, burn, IP allow-list, read/failure counts, webhooks)
- Organization policy seeding via `storage.managed` (Chrome / Firefox enterprise)

Password defaults are intentionally not supported — use the web app when a password is required.

## Development

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm --filter @crypt.fyi/extension dev
```

3. Load the extension in your browser:
   - Chrome/Edge:
     1. Go to `chrome://extensions`
     2. Enable "Developer mode"
     3. Click "Load unpacked"
     4. Select the `dist` directory
   - Firefox:
     1. Go to `about:debugging`
     2. Click "This Firefox"
     3. Click "Load Temporary Add-on"
     4. Select any file in the `dist` directory

## Building

```bash
pnpm --filter @crypt.fyi/extension build
```

The built extension will be in the `dist` directory.

## Configuration

Precedence for each setting: **your saved options → organization managed policy → built-in defaults**.

| Key | Description |
|-----|-------------|
| `apiUrl` | API base URL |
| `webUrl` | Share-link base URL |
| `ttl` | TTL in ms (one of the supported durations) |
| `burn` | Burn after reading |
| `ips` | Comma-separated IP/CIDR allow-list (max 3) |
| `rc` | Max successful reads (2–10; only when `burn` is false) |
| `fc` | Burn after N failed attempts (1–10) |
| `webhookUrl` / `webhookName` | Webhook target and label |
| `webhookOnRead` / `webhookOnFailPassword` / `webhookOnFailIp` / `webhookOnBurn` | Webhook events |

Open settings from the extension toolbar icon, or via the browser’s extension details → Options. Use **Export / Import JSON** to share a config file with self-hosters who are not on managed browsers. **Reset to defaults** clears your overrides so managed/build values apply again.

### Chrome enterprise (seed defaults)

1. Force-install or allow the extension for your org.
2. Set **Policy for extensions** using the shape in [`examples/chrome-extension-policy.json`](./examples/chrome-extension-policy.json) (Chrome expects `{ "key": { "Value": ... } }`).
3. Confirm policies at `chrome://policy`. The extension schema is shipped as `managed_schema.json`.

### Firefox enterprise (seed defaults)

Use `policies.json` `3rdparty.Extensions` as in [`examples/firefox-policies.json`](./examples/firefox-policies.json). Replace the extension ID with your signed add-on ID. Firefox may require a browser restart before `storage.managed` updates appear.

### Build-time env (last resort / branded builds)

| Variable | Default |
|----------|---------|
| `VITE_API_URL` | `https://api.crypt.fyi` |
| `VITE_WEB_URL` | `https://crypt.fyi` |
| `VITE_DEFAULT_TTL` | `1800000` (30 minutes) |
| `VITE_KEY_LENGTH` | `32` |

## Usage

1. Select any text on a webpage
2. Right-click and select **Encrypt and Share with crypt.fyi**
3. The encrypted URL is copied to your clipboard using your configured defaults
4. Share the URL with your recipient

## Security

- All encryption is performed locally in your browser
- The encrypted content is sent to the configured API host
- Default create options burn after reading with a 30-minute TTL unless overridden
- Pointing `apiUrl` / `webUrl` at non-default hosts changes who receives ciphertext and who hosts the share UI — only use hosts you trust

## License

Same as the main crypt.fyi project
