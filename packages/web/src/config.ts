import { INLINE_PAYLOAD_MAX_BYTES } from '@crypt.fyi/core';

export const config = Object.freeze({
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4321',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  CRYPT_FYI_GITHUB_URL: 'https://github.com/osbytes/crypt.fyi',
  CRYPT_FYI_API_DOCS_URL: 'https://api.crypt.fyi/docs',
  CRYPT_FYI_CLI_URL: 'https://www.npmjs.com/package/@crypt.fyi/cli',
  CRYPT_FYI_CHROME_EXTENSION_URL:
    'https://chromewebstore.google.com/detail/cryptfyi/hkmbmkjfjfdbpohlllleaacjkacfhald',
  // Referral + UTM params match the README deploy badge for attribution.
  CRYPT_FYI_RAILWAY_DEPLOY_URL:
    'https://railway.com/deploy/Pmkrsc?referralCode=ToZEjF&utm_medium=integration&utm_source=template&utm_campaign=generic',
  CRYPT_FYI_DOCKER_DOCS_URL: 'https://github.com/osbytes/crypt.fyi#docker',
  CRYPT_FYI_SPEC_URL: 'https://github.com/osbytes/crypt.fyi/blob/main/SPECIFICATION.md',
  // Largest file the UI will accept. Defaults to the inline threshold so an
  // inline-only deployment cannot offer a file it has nowhere to put; raise it
  // wherever object storage is enabled (BLOB_STORAGE_ENABLED on the API).
  MAX_FILE_SIZE: parsePositiveInt(import.meta.env.VITE_MAX_FILE_SIZE, INLINE_PAYLOAD_MAX_BYTES),
  // Shown in the header and the browser tab. Set VITE_APP_NAME to rebrand
  // without touching source.
  APP_NAME: import.meta.env.VITE_APP_NAME?.trim() || 'CyberForce Crypt',
  MAX_IP_RESTRICTIONS: 3,
  KEY_LENGTH: 32,
  // Password policy is a deployment decision, not a product one: a public
  // instance wants it optional, an internal one may want it mandatory. Baked in
  // at build time like VITE_API_URL, so set it as a build arg (see Dockerfile.web).
  REQUIRE_PASSWORD: import.meta.env.VITE_REQUIRE_PASSWORD === 'true',
  PASSWORD_MIN_LENGTH: parsePositiveInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH, 5),
  VERSION: __APP_VERSION__,
  GIT_HASH: __GIT_HASH__,
} as const);

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
}
