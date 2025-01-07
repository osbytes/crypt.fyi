export const config = Object.freeze({
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4321',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  CRYPT_FYI_GITHUB_URL: 'https://github.com/osbytes/crypt.fyi',
  CRYPT_FYI_API_DOCS_URL: 'https://api.crypt.fyi/docs',
  MAX_IP_RESTRICTIONS: 3,
  KEY_LENGTH: 32,
  VERSION: __APP_VERSION__,
  GIT_HASH: __GIT_HASH__,
} as const);
