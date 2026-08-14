/// <reference types="vite/client" />

declare const __GIT_HASH__: string;
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** 'true' makes a password mandatory when creating a secret. Default: optional. */
  readonly VITE_REQUIRE_PASSWORD?: string;
  /** Minimum password length enforced when VITE_REQUIRE_PASSWORD is on. Default: 5. */
  readonly VITE_PASSWORD_MIN_LENGTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
