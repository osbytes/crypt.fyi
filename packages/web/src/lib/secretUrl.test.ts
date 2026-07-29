import { describe, expect, it } from 'vitest';
import { buildSecretLinks, resolveDecryptionKey, stripLegacyKeyFromUrl } from './secretUrl';

describe('buildSecretLinks', () => {
  const input = {
    origin: 'https://crypt.example',
    id: 'vault-id',
    key: '2.decryption-key',
    passwordProtected: true,
  };

  it('separates the decryption key from the share URL when configured', () => {
    const links = buildSecretLinks({ ...input, separateDecryptionKey: true });

    expect(links).toEqual({
      shareUrl: 'https://crypt.example/vault-id?p=true',
      qrUrl: 'https://crypt.example/vault-id?p=true',
    });
    expect(new URL(links.shareUrl).searchParams.has('key')).toBe(false);
    expect(JSON.stringify({ shareUrl: links.shareUrl, qrUrl: links.qrUrl })).not.toContain(
      input.key,
    );
  });

  it('preserves combined fragment links without putting the key in the QR code', () => {
    const links = buildSecretLinks({ ...input, separateDecryptionKey: false });

    expect(links.shareUrl).toBe('https://crypt.example/vault-id?p=true#2.decryption-key');
    expect(links.qrUrl).toBe('https://crypt.example/vault-id?p=true');
    expect(links.qrUrl).not.toContain(input.key);
    expect(new URL(links.shareUrl).searchParams.has('key')).toBe(false);
  });
});

describe('resolveDecryptionKey', () => {
  it('prefers the fragment while still reporting a legacy query key for cleanup', () => {
    expect(resolveDecryptionKey('#fragment-key', 'query-key')).toEqual({
      key: 'fragment-key',
      source: 'fragment',
      hadLegacyQueryKey: true,
    });
  });

  it('supports the deprecated query key when no fragment is present', () => {
    expect(resolveDecryptionKey('', ' legacy-key ')).toEqual({
      key: 'legacy-key',
      source: 'legacy-query',
      hadLegacyQueryKey: true,
    });
  });

  it('reports a missing key without manufacturing a value', () => {
    expect(resolveDecryptionKey('#  ', null)).toEqual({
      key: '',
      source: 'missing',
      hadLegacyQueryKey: false,
    });
  });

  it('still requests cleanup for an empty legacy key parameter', () => {
    expect(resolveDecryptionKey('', '')).toEqual({
      key: '',
      source: 'missing',
      hadLegacyQueryKey: true,
    });
  });
});

describe('stripLegacyKeyFromUrl', () => {
  it('removes legacy keys while preserving unrelated state and a fragment', () => {
    expect(
      stripLegacyKeyFromUrl('/vault-id', '?key=first&p=true&key=second&locale=fr', '#fragment-key'),
    ).toBe('/vault-id?p=true&locale=fr#fragment-key');
  });
});
