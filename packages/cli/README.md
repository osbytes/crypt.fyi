# @crypt.fyi/cli

<a href="https://crypt.fyi" target="_blank">
  <img src="https://crypt.fyi/logo-dark.svg" style="width: 100px;" alt="logo" />
</a>

CLI for interacting with the [crypt.fyi](https://crypt.fyi) API.

## Installation

```bash
npm install -g @crypt.fyi/cli
```

## Usage

```bash
cfyi --help
cfyi encrypt --help
```

### Encrypt with a webhook

Use the same webhook options as the website’s advanced settings. The server receives `POST` notifications at your URL when the configured events occur (for example, when the secret is read or burned).

```bash
cfyi encrypt "your secret" \
  --webhook-url https://example.com/hooks/crypt-fyi \
  --webhook-name "CI token" \
  --webhook-on-burn
```

By default, the API is also notified on a successful read; pass `--no-webhook-on-read` to disable that.
