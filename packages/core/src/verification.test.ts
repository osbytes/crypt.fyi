import { deriveVerificationHash, parseKey, KEY_VERSION_2_PREFIX } from './verification';
import { sha512 } from './hash';

describe('parseKey', () => {
  it('detects the v2 prefix and strips it', () => {
    expect(parseKey(`${KEY_VERSION_2_PREFIX}abc123`)).toEqual({ scheme: 'v2', rawKey: 'abc123' });
  });

  it('treats an unprefixed key as legacy', () => {
    expect(parseKey('abc123')).toEqual({ scheme: 'legacy', rawKey: 'abc123' });
  });
});

describe('deriveVerificationHash', () => {
  it('legacy scheme matches the historical sha512(key + password)', async () => {
    expect(await deriveVerificationHash('legacy', 'thekey', 'pw')).toBe(sha512('thekey' + 'pw'));
    expect(await deriveVerificationHash('legacy', 'thekey')).toBe(sha512('thekey'));
  });

  it('v2 is deterministic, differs from legacy/other password, and binds salt to the key', async () => {
    const a = await deriveVerificationHash('v2', 'thekey', 'pw');
    const b = await deriveVerificationHash('v2', 'thekey', 'pw');
    expect(a).toBe(b);
    expect(a).not.toBe(sha512('thekey' + 'pw'));
    expect(a).not.toBe(await deriveVerificationHash('v2', 'thekey', 'other'));
    expect(a).not.toBe(await deriveVerificationHash('v2', 'key-b', 'pw'));
  });
});
