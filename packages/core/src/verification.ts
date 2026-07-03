import { argon2idAsync } from '@noble/hashes/argon2';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/hashes/utils';
import { Buffer } from './buffer';
import { sha512 } from './hash';

// The server-stored verification hash `h` proves the reader possesses the URL
// key without revealing it. The legacy scheme (`sha512(key + password)`) is fast
// and unsalted: an attacker holding both the URL key and a datastore dump can
// brute-force a weak password with one SHA-512 per guess — cheaper than
// attacking the memory-hard content layer.
//
// The v2 scheme derives `h` with Argon2id, salted by sha256(rawKey). The salt is
// unique per secret and reproducible by anyone with the key (create and read
// both have it), so it never has to be transmitted or stored separately, and the
// server still only ever sees the resulting hash.
//
// The scheme is selected by a version prefix embedded in the URL-fragment key
// itself (`2.<rawKey>`), so callers keep treating the key as an opaque string
// and legacy links (bare `<rawKey>`) continue to verify with the old scheme.

export const KEY_VERSION_2_PREFIX = '2.';

const ARGON2_PARAMS = {
  t: 2,
  m: 19456, // 19 MiB
  p: 1,
  dkLen: 32,
} as const;

/** Splits a URL-fragment key into its verification scheme and the raw key used for content crypto. */
export const parseKey = (key: string): { scheme: 'legacy' | 'v2'; rawKey: string } => {
  if (key.startsWith(KEY_VERSION_2_PREFIX)) {
    return { scheme: 'v2', rawKey: key.slice(KEY_VERSION_2_PREFIX.length) };
  }
  return { scheme: 'legacy', rawKey: key };
};

/** Computes the server verification hash for a given raw key + optional password under the requested scheme. */
export const deriveVerificationHash = async (
  scheme: 'legacy' | 'v2',
  rawKey: string,
  password?: string,
): Promise<string> => {
  const secret = rawKey + (password ?? '');
  if (scheme === 'legacy') {
    return sha512(secret);
  }
  const salt = nobleSha256(utf8ToBytes(rawKey));
  const derived = await argon2idAsync(utf8ToBytes(secret), salt, ARGON2_PARAMS);
  return Buffer.from(derived).toString('hex');
};
