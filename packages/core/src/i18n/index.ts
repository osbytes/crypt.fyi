import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';

export * from './types';
export { en } from './locales/en';
export { es } from './locales/es';
export { de } from './locales/de';

export const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
  de: {
    translation: de,
  },
} as const;

export const supportedLanguages: Record<keyof typeof resources, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};
export const supportedLanguagesOptions = Object.entries(supportedLanguages).map(([key, value]) => ({
  value: key,
  label: value,
}));
