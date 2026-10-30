/// <reference types="vite/client" />

declare const __GIT_HASH__: string;
declare const __APP_VERSION__: string;

interface Window {
  // Set by /config.js before the app loads; see public/config.js.
  __CRYPT_FYI_CONFIG__?: { apiUrl?: string };
}
