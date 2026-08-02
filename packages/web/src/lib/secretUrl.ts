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

/** Read a current fragment key. Missing keys are supplied through the prompt. */
export function resolveDecryptionKey(fragment: string): string {
  return fragment.replace(/^#/, '').trim();
}

/** Remove every legacy query-string key without reading its value. */
export function removeLegacyQueryKey(url: URL): boolean {
  const hadLegacyKey = url.searchParams.has('key');
  if (hadLegacyKey) {
    url.searchParams.delete('key');
  }
  return hadLegacyKey;
}
