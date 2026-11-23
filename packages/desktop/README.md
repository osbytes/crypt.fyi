# crypt.fyi Desktop

A tray (menu bar) app for macOS, Windows and Linux that creates crypt.fyi secret links from anywhere. Press the global shortcut, the quick-create window opens with your clipboard already filled in, and one keystroke later the encrypted link is on your clipboard.

Built with [Tauri 2](https://v2.tauri.app/): a small native shell around the system WebView, with the same `@crypt.fyi/core` encryption the web client, CLI and browser extension use.

## Features

- Global shortcut (default `Ctrl+Alt+Shift+E`, `⌘⌥⇧E` on macOS) opens or hides the quick-create window from any app
- Prefills the secret from the clipboard (can be turned off), then replaces the clipboard with the link
- Per-secret password, expiry (5 minutes to 7 days) and burn after reading
- A notification confirms the copy; if notifications are blocked, the window shows the link instead
- Tray menu: New secret, Settings, Quit. Closing the window keeps the app running in the tray
- Settings: API URL, web URL, shortcut, default expiry and burn, clipboard prefill, language and theme
- Translated into every language the web client supports

## Usage

| Action | How |
| --- | --- |
| Open the quick-create window | Global shortcut, or **New secret** in the tray menu |
| Create and copy the link | **Encrypt and copy link**, or `Ctrl+Enter` / `⌘↩` in the secret field |
| Hide the window | `Esc`, the shortcut again, or the window's close button |
| Change the shortcut | **Settings**, select the shortcut field and press a new combination (it must include Ctrl, Alt or Cmd) |
| Quit | **Quit crypt.fyi** in the tray menu |

On macOS the app has no Dock icon; look for it in the menu bar. Some Linux desktops (GNOME without the AppIndicator extension, for example) hide tray icons, and global shortcuts are not available under Wayland sessions that block them; the window still opens when you launch the app again.

## Security model

- **Encryption stays on the device.** The key is generated, the content compressed and encrypted, and the verification hash derived inside the app's WebView by `@crypt.fyi/core`. The server only receives ciphertext and the hash, exactly as with the web client. See [SPECIFICATION.md](../../SPECIFICATION.md).
- **Nothing secret is stored.** Settings (endpoints, shortcut, defaults) live in the WebView's local storage. Secret content, passwords and links are only held in the form while the window is open and cleared whenever it hides. Notifications never contain the link, because notification centers keep a history.
- **Narrow native surface.** The Rust side only owns the tray and window lifecycle and never sees secret material. The window's [capability](src-tauri/capabilities/default.json) allows clipboard text, the global shortcut, notifications and showing/hiding itself; there is no filesystem, shell, process or HTTP plugin.
- **Strict CSP.** Scripts, styles and fonts load only from the app bundle. `connect-src` allows `https:` (any API you configure) and plain `http` only on loopback for local development. Settings reject other URLs so a misconfigured endpoint fails up front instead of at request time.

## Development

The frontend is plain TypeScript and Tailwind on Vite, styled with [`@crypt.fyi/theme`](../theme/README.md) like the extension's settings page. Running the app needs the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/): a Rust toolchain plus, on Linux, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev` and `librsvg2-dev`.

```bash
pnpm install
pnpm --filter @crypt.fyi/core build     # the app imports core's build output

pnpm --filter @crypt.fyi/desktop tauri:dev
```

To point the app at a local API (`pnpm dev` at the repo root serves one on `http://localhost:4321`), set the API URL in Settings to `http://localhost:4321` and the web URL to `http://localhost:5173`.

Checks that run in the normal workspace pipeline and need no Rust:

```bash
pnpm --filter @crypt.fyi/desktop typecheck
pnpm --filter @crypt.fyi/desktop lint
pnpm --filter @crypt.fyi/desktop test
pnpm --filter @crypt.fyi/desktop build   # frontend only, into dist/
```

## Building installers

```bash
pnpm --filter @crypt.fyi/desktop tauri:build
```

Bundles land in `src-tauri/target/release/bundle/` (`.dmg`/`.app` on macOS, `.msi`/NSIS `.exe` on Windows, `.deb`/`.rpm`/`.AppImage` on Linux). Each platform has to be built on that platform.

The [Desktop workflow](../../.github/workflows/desktop.yml) builds all of them on GitHub Actions for every change to this package, `core` or `theme`, and attaches the installers to the run as artifacts. The builds are not code-signed yet, so macOS Gatekeeper and Windows SmartScreen will warn on first launch.

## Install from a CI build

1. Open the latest successful [Desktop workflow run](https://github.com/osbytes/crypt.fyi/actions/workflows/desktop.yml) and download the artifact for your platform.
2. Install it:
   - **macOS:** open the `.dmg`, drag crypt.fyi to Applications, then right-click the app and choose **Open** the first time (the build is unsigned).
   - **Windows:** run the `.msi` or `-setup.exe`; in SmartScreen choose **More info → Run anyway**.
   - **Linux:** install the `.deb` (`sudo apt install ./crypt.fyi_*.deb`) or `.rpm`, or make the `.AppImage` executable and run it.
3. Launch crypt.fyi. It opens once, then lives in the tray; use the shortcut from then on.
