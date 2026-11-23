import { describe, expect, it } from 'vitest';
import { resources } from '@crypt.fyi/core';
import { createTranslator, resolveLanguage } from './i18n';

describe('resolveLanguage', () => {
  it('honors an explicit preference', () => {
    expect(resolveLanguage('fr', ['de-DE'])).toBe('fr');
  });

  it('matches the first supported system language by its base tag', () => {
    expect(resolveLanguage('system', ['pt-BR', 'zh-CN', 'en-US'])).toBe('zh');
  });

  it('falls back to English', () => {
    expect(resolveLanguage('system', ['pt-BR'])).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
  });
});

describe('createTranslator', () => {
  it('looks up nested keys', () => {
    expect(createTranslator('en')('desktop.tray.newSecret')).toBe('New secret');
    expect(createTranslator('de')('desktop.tray.newSecret')).toBe('Neues Geheimnis');
  });

  it('interpolates variables', () => {
    expect(createTranslator('en')('desktop.errors.server', { status: 503 })).toBe(
      'The server rejected the request (status 503).',
    );
  });

  it('picks plural forms from count', () => {
    const t = createTranslator('en');
    expect(t('common.time.hour', { count: 1 })).toBe('1 hour');
    expect(t('common.time.hour', { count: 4 })).toBe('4 hours');
    expect(createTranslator('zh')('common.time.day', { count: 3 })).toBe('3 天');
  });

  it('every locale fills in every desktop string and keeps its placeholders', () => {
    const collect = (node: unknown, prefix = ''): [string, string][] =>
      typeof node === 'string'
        ? [[prefix, node]]
        : Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
            collect(value, prefix ? `${prefix}.${key}` : key),
          );
    const placeholders = (text: string) => (text.match(/\{\{\w+\}\}/g) ?? []).sort();
    const english = new Map(collect(resources.en.translation.desktop));

    for (const [language, { translation }] of Object.entries(resources)) {
      const entries = collect(translation.desktop);
      expect(entries.map(([path]) => path).sort(), language).toEqual([...english.keys()].sort());
      for (const [path, text] of entries) {
        expect(text.trim(), `${language}:${path}`).not.toBe('');
        expect(placeholders(text), `${language}:${path}`).toEqual(
          placeholders(english.get(path) ?? ''),
        );
      }
    }
  });
});
