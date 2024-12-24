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

export const supportedLanguages: Record<keyof typeof resources, string> = {
  en: 'English',
  es: 'Español',
};
export const supportedLanguagesOptions = Object.entries(supportedLanguages).map(([key, value]) => ({
  value: key,
  label: value,
}));
