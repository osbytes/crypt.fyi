export const config = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.crypt.fyi',
  webUrl: (import.meta.env.VITE_WEB_URL as string | undefined) || 'https://crypt.fyi',
  defaultTtl: getEnvNumber(import.meta.env.VITE_DEFAULT_TTL, 30 * 60 * 1000),
  keyLength: getEnvNumber(import.meta.env.VITE_KEY_LENGTH, 32),
} as const;

function getEnvNumber(env: string | undefined, defaultValue: number): number {
  if (!env) {
    return defaultValue;
  }
  return parseInt(env, 10);
}
