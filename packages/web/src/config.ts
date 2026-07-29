export const config = Object.freeze({
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4321',
  SEPARATE_DECRYPTION_KEY: import.meta.env.VITE_SEPARATE_DECRYPTION_KEY === 'true',
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
  MAX_IP_RESTRICTIONS: 3,
  KEY_LENGTH: 32,
  VERSION: __APP_VERSION__,
  GIT_HASH: __GIT_HASH__,
} as const);
