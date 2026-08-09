interface SecretLinksInput {
  origin: string;
  id: string;
  key: string;
  passwordProtected: boolean;
}

export interface SecretLinks {
  combinedUrl: string;
  keylessUrl: string;
  qrUrl: string;
}

/** Build both supported share forms while keeping the QR behavior compatible. */
export function buildSecretLinks({
  origin,
  id,
  key,
  passwordProtected,
}: SecretLinksInput): SecretLinks {
  const url = new URL(`/${encodeURIComponent(id)}`, origin);
  if (passwordProtected) {
    url.searchParams.set('p', 'true');
  }

  const keylessUrl = url.toString();
  const combinedUrl = `${keylessUrl}#${key}`;
  return {
    combinedUrl,
    keylessUrl,
    qrUrl: combinedUrl,
  };
}

/**
 * Legacy clients put the decryption key in `?key=`, which can reach server logs.
 * Move it into the fragment (when the fragment is empty) and strip every query
 * occurrence so the link remains usable without keeping the unsafe form around.
 */
export function migrateLegacyQueryKey(url: URL): boolean {
  const hadLegacyKey = url.searchParams.has('key');
  if (!hadLegacyKey) {
    return false;
  }

  const legacyKey = url.searchParams.get('key')?.trim() ?? '';
  url.searchParams.delete('key');

  if (legacyKey && !url.hash.slice(1).trim()) {
    url.hash = legacyKey;
  }

  return true;
}
