export const config = Object.freeze({
  API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:4321',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const);
