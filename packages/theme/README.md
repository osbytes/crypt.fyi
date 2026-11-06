# @crypt.fyi/theme

The design language shared by `@crypt.fyi/web` and `@crypt.fyi/extension`. It is private and has no build step: consumers compile its sources with their own Vite and Tailwind.

| Export | Contents |
| --- | --- |
| `@crypt.fyi/theme/tokens.css` | Light and dark tokens, Tailwind theme mapping, base element styles. Import after `tailwindcss`. |
| `@crypt.fyi/theme` | Framework-agnostic preference logic: storage, OS tracking, applying a theme. |
| `@crypt.fyi/theme/fonts/{inter,space-grotesk,jetbrains-mono}` | Self-hosted fonts. Import only the ones a surface uses. |
| `@crypt.fyi/theme/vite` | `themeInitScript()`, a plugin that serves `src/theme-init.js` and adds its script tag to the page. |

UI components are deliberately not shared. The web client uses React and shadcn, and the extension's settings page stays plain HTML, so a shared component library would add React to the extension for a single form.

A preference is stored in `localStorage`, which is per origin. The web client and the extension therefore keep separate choices.
