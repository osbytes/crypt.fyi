export type DecryptionKeySource = 'fragment' | 'legacy-query' | 'manual' | 'missing';

export interface ResolvedDecryptionKey {
  key: string;
  source: DecryptionKeySource;
  hadLegacyQueryKey: boolean;
}

interface SecretLinksInput {
  origin: string;
  id: string;
  key: string;
  passwordProtected: boolean;
  separateDecryptionKey: boolean;
}

export interface SecretLinks {
  shareUrl: string;
  qrUrl: string;
}

/**
 * Builds the user-facing share artifacts without ever placing the key in a
 * query parameter. QR codes intentionally remain key-free in both modes
 * because they are commonly downloaded, screenshotted, and retained.
 */
export function buildSecretLinks({
  origin,
  id,
  key,
  passwordProtected,
  separateDecryptionKey,
}: SecretLinksInput): SecretLinks {
  const url = new URL(`/${encodeURIComponent(id)}`, origin);
  if (passwordProtected) {
    url.searchParams.set('p', 'true');
  }

  const keylessUrl = url.toString();
  return {
    shareUrl: separateDecryptionKey ? keylessUrl : `${keylessUrl}#${key}`,
    qrUrl: keylessUrl,
  };
}

/**
 * Resolves current fragment links first, then the deprecated query-string
 * format. Callers should remove a legacy query key from history immediately.
 */
export function resolveDecryptionKey(
  fragment: string,
  legacyQueryKey: string | null,
): ResolvedDecryptionKey {
  const fragmentKey = fragment.replace(/^#/, '').trim();
  const queryKey = legacyQueryKey?.trim() ?? '';
  const hadLegacyQueryKey = legacyQueryKey !== null;

  if (fragmentKey) {
    return {
      key: fragmentKey,
      source: 'fragment',
      hadLegacyQueryKey,
    };
  }

  if (queryKey) {
    return {
      key: queryKey,
      source: 'legacy-query',
      hadLegacyQueryKey: true,
    };
  }

  return {
    key: '',
    source: 'missing',
    hadLegacyQueryKey,
  };
}

/** Removes every deprecated `key` query parameter while preserving the rest. */
export function stripLegacyKeyFromUrl(pathname: string, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  params.delete('key');
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}
