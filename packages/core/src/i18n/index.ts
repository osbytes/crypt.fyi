import { en } from './locales/en';
import { es } from './locales/es';
import { de } from './locales/de';
import { fr } from './locales/fr';

export * from './types';
export { en } from './locales/en';
export { es } from './locales/es';
export { de } from './locales/de';
export { fr } from './locales/fr';

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
  fr: {
    translation: fr,
  },
} as const;

export const supportedLanguages: Record<keyof typeof resources, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
};
export const supportedLanguagesOptions = Object.entries(supportedLanguages).map(([key, value]) => ({
  value: key,
  label: value,
}));
