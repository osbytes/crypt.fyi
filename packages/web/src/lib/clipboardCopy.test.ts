import { afterEach, describe, expect, it, vi } from 'vitest';
import { clipboardCopy } from './clipboardCopy';

const copyFallback = vi.hoisted(() => vi.fn(() => true));

vi.mock('copy-to-clipboard', () => ({
  default: copyFallback,
}));

afterEach(() => {
  copyFallback.mockClear();
  vi.unstubAllGlobals();
});

describe('clipboardCopy', () => {
  it('never opens the legacy prompt fallback for an automatic copy', async () => {
    vi.stubGlobal('navigator', {});

    await expect(clipboardCopy('sensitive-value', { userInitiatedFallback: false })).resolves.toBe(
      false,
    );
    expect(copyFallback).not.toHaveBeenCalled();
  });

  it('does not fall back after an automatic Clipboard API rejection', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('denied')),
      },
    });

    await expect(clipboardCopy('sensitive-value', { userInitiatedFallback: false })).resolves.toBe(
      false,
    );
    expect(copyFallback).not.toHaveBeenCalled();
  });

  it('retains the user-visible fallback for an explicit copy action', async () => {
    vi.stubGlobal('navigator', {});

    await expect(clipboardCopy('user-selected-value')).resolves.toBe(true);
    expect(copyFallback).toHaveBeenCalledOnce();
  });
});
