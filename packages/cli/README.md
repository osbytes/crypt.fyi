# @crypt.fyi/cli

<a href="https://crypt.fyi" target="_blank">
  <img src="https://crypt.fyi/logo-dark.svg" style="width: 100px;" alt="logo" />
</a>

CLI for interacting with the [crypt.fyi](https://crypt.fyi) API.

## Installation

### npm

```bash
npm install -g @crypt.fyi/cli
```

### Homebrew (macOS / Linux)

The formula lives in the [`Formula/`](https://github.com/osbytes/crypt.fyi/tree/main/Formula) directory of this repository, so tap the repository by URL first:

```bash
brew tap osbytes/crypt-fyi https://github.com/osbytes/crypt.fyi
brew install crypt-fyi
```

Both install the `cfyi` binary. `brew upgrade crypt-fyi` picks up new releases; the formula is bumped automatically after each CLI publish.

## Usage

```bash
cfyi --help
cfyi encrypt --help
```

### Encrypt with a webhook

Use the same webhook options as the website's advanced settings. The server receives `POST` notifications at your URL when the configured events occur.

```bash
cfyi encrypt "your secret" \
  --wh-url https://example.com/hooks/crypt-fyi \
  --wh-events read,burn \
  --wh-name "CI token"
```

Available events for `--wh-events`:
- `read` - When the secret is read successfully (default)
- `burn` - When the secret is burned
- `failed-key` - When decryption fails (wrong key or password)
- `failed-ip` - When the viewer IP fails the IP allow-list

Multiple events can be specified as a comma-separated list (e.g., `read,burn,failed-key`).
