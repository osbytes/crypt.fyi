import { en } from './locales/en';
import { es } from './locales/es';

export * from './types';
export { en } from './locales/en';
export { es } from './locales/es';

export const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
} as const;
