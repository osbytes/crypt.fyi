import { describe, expect, it } from 'vitest';
import { buildSecretLinks, migrateLegacyQueryKey } from './secretUrl';

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

describe('migrateLegacyQueryKey', () => {
  it('moves a legacy query key into the fragment and strips the query param', () => {
    const url = new URL(
      'https://crypt.example/vault-id?keep=first&key=legacy-key&keep=second',
    );

    expect(migrateLegacyQueryKey(url)).toBe(true);
    expect(url.toString()).toBe(
      'https://crypt.example/vault-id?keep=first&keep=second#legacy-key',
    );
  });

  it('preserves an existing fragment and still strips the query key', () => {
    const url = new URL(
      'https://crypt.example/vault-id?key=legacy-key#fragment-key',
    );

    expect(migrateLegacyQueryKey(url)).toBe(true);
    expect(url.toString()).toBe('https://crypt.example/vault-id#fragment-key');
  });

  it('removes every key parameter while preserving the rest of the URL', () => {
    const url = new URL(
      'https://crypt.example/vault-id?keep=first&key=unsafe-one&key=unsafe-two&keep=second',
    );

    expect(migrateLegacyQueryKey(url)).toBe(true);
    expect(url.searchParams.has('key')).toBe(false);
    expect(url.hash).toBe('#unsafe-one');
  });

  it('is idempotent when no legacy key is present', () => {
    const url = new URL('https://crypt.example/vault-id?keep=true#fragment-key');

    expect(migrateLegacyQueryKey(url)).toBe(false);
    expect(url.toString()).toBe('https://crypt.example/vault-id?keep=true#fragment-key');
  });
});
