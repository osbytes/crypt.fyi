import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function stubWindow(search: string, hash = '', pathname = '/vault-id') {
  const location = {
    hash,
    pathname,
    search,
  };
  const replaceState = vi.fn((_state: unknown, _title: string, url: string) => {
    const parsed = new URL(url, 'https://crypt.example');
    location.hash = parsed.hash;
    location.pathname = parsed.pathname;
    location.search = parsed.search;
  });
  vi.stubGlobal('window', {
    location,
    history: {
      replaceState,
      state: { navigation: 'state' },
    },
  });
  return { location, replaceState };
}

describe('legacy key bootstrap', () => {
  it('scrubs at bootstrap and keeps the key only through replayed initial renders', async () => {
    const { replaceState } = stubWindow('?p=true&key=legacy-key&key=discarded');

    const { consumeLegacyQueryKey } = await import('./legacyKeyBootstrap');

    expect(replaceState).toHaveBeenCalledWith({ navigation: 'state' }, '', '/vault-id?p=true');
    expect(consumeLegacyQueryKey()).toEqual({
      legacyQueryKey: 'legacy-key',
      hadLegacyQueryKey: true,
    });
    expect(consumeLegacyQueryKey()).toEqual({
      legacyQueryKey: 'legacy-key',
      hadLegacyQueryKey: true,
    });

    vi.runAllTimers();
    expect(consumeLegacyQueryKey()).toEqual({
      legacyQueryKey: null,
      hadLegacyQueryKey: false,
    });
  });

  it('discards a query value when a fragment key already has priority', async () => {
    const { replaceState } = stubWindow('?key=query-key&p=true', '#fragment-key');

    const { consumeLegacyQueryKey } = await import('./legacyKeyBootstrap');

    expect(replaceState).toHaveBeenCalledWith(
      { navigation: 'state' },
      '',
      '/vault-id?p=true#fragment-key',
    );
    expect(consumeLegacyQueryKey()).toEqual({
      legacyQueryKey: null,
      hadLegacyQueryKey: true,
    });
  });

  it('scrubs but never retains a key attached to a non-secret route', async () => {
    const { replaceState } = stubWindow('?key=unrelated-key', '', '/new');

    const { consumeLegacyQueryKey } = await import('./legacyKeyBootstrap');

    expect(replaceState).toHaveBeenCalledWith({ navigation: 'state' }, '', '/new');
    expect(consumeLegacyQueryKey()).toEqual({
      legacyQueryKey: null,
      hadLegacyQueryKey: false,
    });
  });
});
