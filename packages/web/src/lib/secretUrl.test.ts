import { describe, expect, it } from 'vitest';
import { buildSecretLinks, removeLegacyQueryKey, resolveDecryptionKey } from './secretUrl';

describe('buildSecretLinks', () => {
  it('returns both URL forms and keeps the combined QR behavior', () => {
    const links = buildSecretLinks({
      origin: 'https://crypt.example',
      id: 'vault-id',
      key: '2.decryption-key',
      passwordProtected: true,
    });

    expect(links).toEqual({
      combinedUrl: 'https://crypt.example/vault-id?p=true#2.decryption-key',
      keylessUrl: 'https://crypt.example/vault-id?p=true',
      qrUrl: 'https://crypt.example/vault-id?p=true#2.decryption-key',
    });
    expect(new URL(links.keylessUrl).searchParams.has('key')).toBe(false);
  });

  it('omits the password marker when it is not needed', () => {
    expect(
      buildSecretLinks({
        origin: 'https://crypt.example',
        id: 'vault-id',
        key: 'key',
        passwordProtected: false,
      }).keylessUrl,
    ).toBe('https://crypt.example/vault-id');
  });
});

describe('resolveDecryptionKey', () => {
  it('reads and trims a fragment key', () => {
    expect(resolveDecryptionKey('# fragment-key ')).toBe('fragment-key');
  });

  it('reports a missing fragment without manufacturing a key', () => {
    expect(resolveDecryptionKey('')).toBe('');
  });
});

describe('removeLegacyQueryKey', () => {
  it('removes every key parameter while preserving the rest of the URL', () => {
    const url = new URL(
      'https://crypt.example/vault-id?keep=first&key=unsafe-one&key=unsafe-two&keep=second#fragment-key',
    );

    expect(removeLegacyQueryKey(url)).toBe(true);
    expect(url.toString()).toBe(
      'https://crypt.example/vault-id?keep=first&keep=second#fragment-key',
    );
  });

  it('is idempotent when no legacy key is present', () => {
    const url = new URL('https://crypt.example/vault-id?keep=true#fragment-key');

    expect(removeLegacyQueryKey(url)).toBe(false);
    expect(url.toString()).toBe('https://crypt.example/vault-id?keep=true#fragment-key');
  });
});
