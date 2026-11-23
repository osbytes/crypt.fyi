import { resources, type TranslationKeys } from '@crypt.fyi/core';
import type { LanguageCode, LanguagePreference } from './settings';

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

type Leaf = Leaves<TranslationKeys>;
/** i18next-style plural bases: `common.time.minute` resolves to `_one` / `_other`. */
type PluralBase = Leaf extends infer L
  ? L extends `${infer B}_${'one' | 'other'}`
    ? B
    : never
  : never;

export type TranslationKey = Exclude<Leaf, `${string}_${'one' | 'other'}`> | PluralBase;
export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

const FALLBACK: LanguageCode = 'en';

function isLanguageCode(value: string): value is LanguageCode {
  return Object.prototype.hasOwnProperty.call(resources, value);
}

/** Picks the first supported language from the OS preference list (`zh-CN` matches `zh`). */
export function resolveLanguage(
  preference: LanguagePreference,
  systemLanguages: readonly string[],
): LanguageCode {
  if (preference !== 'system') return preference;
  for (const tag of systemLanguages) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLanguageCode(base)) return base;
  }
  return FALLBACK;
}

function lookup(language: LanguageCode, path: string): string | undefined {
  let node: unknown = resources[language].translation;
  for (const segment of path.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

function resolve(language: LanguageCode, key: string, count: number | undefined) {
  if (count !== undefined) {
    const category = new Intl.PluralRules(language).select(count);
    return lookup(language, `${key}_${category}`) ?? lookup(language, `${key}_other`);
  }
  return lookup(language, key);
}

/**
 * A minimal i18next-compatible lookup over the shared core locales: `{{name}}` interpolation
 * and `count`-driven plurals, falling back to English and then to the key itself.
 */
export function createTranslator(language: LanguageCode): Translate {
  return (key, vars) => {
    const count = typeof vars?.count === 'number' ? vars.count : undefined;
    const template = resolve(language, key, count) ?? resolve(FALLBACK, key, count) ?? key;
    if (!vars) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}
