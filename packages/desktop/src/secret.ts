import { ErrorUnexpectedStatus } from '@crypt.fyi/core';
import { TTL_OPTIONS } from './config';
import type { TranslationKey } from './i18n';

export type CreateFormValues = {
  content: string;
  password: string;
  ttl: number;
  burn: boolean;
};

/** The subset of `Client.create` input the quick-create window exposes. */
export type CreateInput = {
  c: string;
  p?: string;
  b: boolean;
  ttl: number;
};

export type CreateInputResult =
  | { ok: true; input: CreateInput }
  | { ok: false; error: 'empty' | 'invalidTtl' };

export function buildCreateInput(values: CreateFormValues): CreateInputResult {
  // Whitespace-only content is almost always an accidental empty paste.
  if (values.content.trim() === '') return { ok: false, error: 'empty' };
  if (!TTL_OPTIONS.some((option) => option.value === values.ttl)) {
    return { ok: false, error: 'invalidTtl' };
  }

  // The content itself is sent as typed: trimming could corrupt keys or multi-line secrets.
  const input: CreateInput = { c: values.content, b: values.burn, ttl: values.ttl };
  if (values.password !== '') input.p = values.password;
  return { ok: true, input };
}

/**
 * Same link shape as the web client: the key stays in the fragment, which browsers never send
 * to the server, and `?p=true` tells the reader to prompt for the password.
 */
export function buildSecretUrl({
  webUrl,
  id,
  key,
  passwordProtected,
}: {
  webUrl: string;
  id: string;
  key: string;
  passwordProtected: boolean;
}): string {
  const base = webUrl.replace(/\/+$/, '');
  const query = passwordProtected ? '?p=true' : '';
  return `${base}/${encodeURIComponent(id)}${query}#${key}`;
}

export type ErrorMessage = { key: TranslationKey; vars?: Record<string, string | number> };

/**
 * Maps a failed create to user-facing copy. Only the status code and API host are surfaced;
 * the error object never carries plaintext, but its message is still not shown verbatim.
 */
export function describeCreateError(error: unknown, apiUrl: string): ErrorMessage {
  if (error instanceof ErrorUnexpectedStatus) {
    if (error.status === 429) return { key: 'desktop.errors.rateLimited' };
    if (error.status === 413) return { key: 'desktop.errors.tooLarge' };
    return { key: 'desktop.errors.server', vars: { status: error.status } };
  }
  // fetch rejects with a TypeError for DNS, TLS, offline and CSP-blocked requests alike.
  if (error instanceof TypeError) {
    return { key: 'desktop.errors.network', vars: { host: hostOf(apiUrl) } };
  }
  return { key: 'desktop.errors.unknown' };
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
