export const config = Object.freeze({
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:4321",
} as const);
