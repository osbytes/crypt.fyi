import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('SEPARATE_DECRYPTION_KEY', () => {
  it('is enabled only by the exact true build-time value', async () => {
    vi.stubEnv('VITE_SEPARATE_DECRYPTION_KEY', 'true');

    const { config } = await import('./config');

    expect(config.SEPARATE_DECRYPTION_KEY).toBe(true);
  });

  it.each(['false', 'TRUE', '1', ''])('remains disabled for %j', async (value) => {
    vi.stubEnv('VITE_SEPARATE_DECRYPTION_KEY', value);

    const { config } = await import('./config');

    expect(config.SEPARATE_DECRYPTION_KEY).toBe(false);
  });
});
