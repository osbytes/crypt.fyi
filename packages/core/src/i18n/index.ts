import { en } from './locales/en';

export * from './types';
export { en } from './locales/en';

// Re-export resources object for i18next
export const resources = {
  en: {
    translation: en,
  },
} as const;
