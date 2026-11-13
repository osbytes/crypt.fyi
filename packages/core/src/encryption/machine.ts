// Symmetric encryption for data protected by a static, high-entropy *machine*
// key (the server's ENCRYPTION_KEY) rather than a user-chosen password.
//
// The password-oriented ciphers (gcm/mlkem*) deliberately run an expensive KDF
// (PBKDF2 at 2^19 iterations) to resist brute-forcing weak human passwords.
// That cost is pointless for a machine key — there is no low-entropy secret to
// stretch — and it runs on the server's hot path (every vault set/get/del and
// every webhook enqueue/dequeue). Here we derive the AES key with HKDF, which is
// fast and appropriate for a key that is already uniformly random.
//
// Format (base64, prefixed with a scheme tag for forward/backward routing):
//   "m1:" || base64( salt[16] || iv[12] || aes-256-gcm-ciphertext )
//
// Values without the "m1:" prefix are legacy PBKDF2-format ciphertexts and are
// transparently decrypted via the gcm module so existing vault entries keep
// working.

import { gcm as aesGcm } from '@noble/ciphers/aes';
import { hkdf } from '@noble/hashes/hkdf';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { randomBytes, concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Buffer } from '../buffer';
import { Decrypt, Encrypt, DecryptError, EncryptError } from './encryption';
import { decrypt as gcmDecrypt } from './gcm';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const SCHEME_PREFIX = 'm1:';
const HKDF_INFO = utf8ToBytes('crypt.fyi/machine-metadata');

const DIGEST_PREFIX = 'hm1:';
// A separate HKDF info keeps digest keys independent of the encryption keys
// derived from the same machine key.
const DIGEST_HKDF_INFO = utf8ToBytes('crypt.fyi/machine-digest');

// Keyring formats, described in the keyring section below.
const KEYED_SCHEME_PREFIX = 'm2:';
const KEYED_DIGEST_PREFIX = 'hm2:';

const deriveKey = (key: string, salt: Uint8Array): Uint8Array =>
  hkdf(sha256, utf8ToBytes(key), salt, HKDF_INFO, KEY_LENGTH);

const deriveDigestKey = (key: string): Uint8Array =>
  hkdf(sha256, utf8ToBytes(key), undefined, DIGEST_HKDF_INFO, KEY_LENGTH);

export const isEncrypted = (value: string): boolean =>
  value.startsWith(SCHEME_PREFIX) || value.startsWith(KEYED_SCHEME_PREFIX);

export const isDigest = (value: string): boolean =>
  value.startsWith(DIGEST_PREFIX) || value.startsWith(KEYED_DIGEST_PREFIX);

/** Raw base64 HMAC, shared by the hm1 and hm2 formats. */
const rawDigest = (value: string, digestKey: Uint8Array, context: string): string => {
  const message = concatBytes(utf8ToBytes(context), new Uint8Array([0]), utf8ToBytes(value));
  return Buffer.from(hmac(sha256, digestKey, message)).toString('base64');
};

/**
 * Deterministic keyed digest, for values that must be compared where the machine
 * key isn't available (such as inside a Redis script). `context` scopes the
 * digest to one use and must not contain a NUL byte, which separates it from
 * `value` so the pair is encoded unambiguously.
 */
export const digest = (value: string, key: string, context: string): string =>
  DIGEST_PREFIX + rawDigest(value, deriveDigestKey(key), context);

export const encrypt: Encrypt = async (content, key) => {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const derivedKey = deriveKey(key, salt);
    const cipher = aesGcm(derivedKey, iv);
    const encrypted = cipher.encrypt(utf8ToBytes(content));

    const result = concatBytes(salt, iv, encrypted);
    return SCHEME_PREFIX + Buffer.from(result).toString('base64');
  } catch (error) {
    throw new EncryptError(error);
  }
};

export const decrypt: Decrypt = async (encryptedContent, key) => {
  // Legacy entries were written with the password-KDF (PBKDF2) gcm cipher.
  if (!encryptedContent.startsWith(SCHEME_PREFIX)) {
    return gcmDecrypt(encryptedContent, key);
  }

  try {
    const data = Buffer.from(encryptedContent.slice(SCHEME_PREFIX.length), 'base64');
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH);

    const derivedKey = deriveKey(key, salt);
    const cipher = aesGcm(derivedKey, iv);
    const decrypted = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptError(error);
  }
};

// ---------------------------------------------------------------------------
// Keyrings: rotating the machine key without losing data
// ---------------------------------------------------------------------------
//
// A keyring holds one primary key, used for every new ciphertext and digest,
// and any number of previous keys that are only used to read existing values.
// This follows the keyset model of Google Tink and Rails Active Record
// Encryption: add the new key, make it primary, keep the old one for reads
// until nothing depends on it, then remove it.
//
// Values written through a keyring carry the id of the key that produced them,
// so a read goes straight to the right key, and a value whose key has been
// removed fails loudly instead of being tried against every key.
//
// Formats:
//   "m2:"  || kid || ":" || base64( salt[16] || iv[12] || aes-256-gcm-ciphertext )
//   "hm2:" || kid || ":" || base64( hmac-sha256 )
//
// For m2 the "m2:<kid>:" header is the GCM associated data, so relabelling a
// ciphertext with another key id makes it fail authentication.
//
// The key id is derived from the key itself (HKDF with its own info string),
// so operators never assign or track ids and every server computes the same id
// for the same key. 48 bits is plenty to tell a handful of live keys apart.

const KEY_ID_HKDF_INFO = utf8ToBytes('crypt.fyi/machine-key-id');
const KEY_ID_LENGTH = 6;
// Legacy PBKDF2 ciphertext is plain base64. Anything else (such as plaintext IP
// restrictions from before they were encrypted) can't be one, and skipping it
// avoids running the deliberately slow PBKDF2 once per key on a hot path.
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export interface Keyring {
  /** Id of the key used for new ciphertexts and digests. */
  readonly primaryId: string;
  /** Every key this keyring can read with, primary first. */
  readonly keys: ReadonlyMap<string, string>;
  /** HMAC key per key id, derived once because every vault read needs one. */
  readonly digestKeys: ReadonlyMap<string, Uint8Array>;
}

const toBase64Url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Stable, non-secret identifier for a machine key. */
export const keyId = (key: string): string =>
  toBase64Url(hkdf(sha256, utf8ToBytes(key), undefined, KEY_ID_HKDF_INFO, KEY_ID_LENGTH));

/**
 * Builds a keyring from the primary key and any previous keys that existing
 * values may still be encrypted or digested with. Duplicates and empty entries
 * are ignored, so listing the primary key among the previous ones is harmless.
 */
export const createKeyring = (primary: string, previous: readonly string[] = []): Keyring => {
  if (!primary) {
    throw new Error('machine keyring requires a primary key');
  }
  const keys = new Map<string, string>();
  for (const key of [primary, ...previous]) {
    if (!key) {
      continue;
    }
    const id = keyId(key);
    const existing = keys.get(id);
    if (existing !== undefined && existing !== key) {
      // Practically impossible at 48 bits, but silently keeping one key would
      // make everything written with the other unreadable.
      throw new Error('machine keyring key id collision; generate a new key');
    }
    keys.set(id, key);
  }
  const digestKeys = new Map([...keys].map(([id, key]) => [id, deriveDigestKey(key)]));
  return { primaryId: keyId(primary), keys, digestKeys };
};

/** Whether the keyring holds any key besides the primary. */
export const hasPreviousKeys = (keyring: Keyring): boolean => keyring.keys.size > 1;

const primaryKey = (keyring: Keyring): string => {
  const key = keyring.keys.get(keyring.primaryId);
  if (key === undefined) {
    throw new Error('machine keyring is missing its primary key');
  }
  return key;
};

/** Parses "<prefix><kid>:<payload>", or returns undefined when the value doesn't match. */
const splitKeyed = (value: string, prefix: string) => {
  if (!value.startsWith(prefix)) {
    return undefined;
  }
  const rest = value.slice(prefix.length);
  const separator = rest.indexOf(':');
  if (separator <= 0) {
    return undefined;
  }
  return { kid: rest.slice(0, separator), payload: rest.slice(separator + 1) };
};

/**
 * The id of the key a keyring ciphertext or digest was made with, or undefined
 * for values that predate key ids (m1, hm1 and legacy PBKDF2).
 */
export const keyIdOf = (value: string): string | undefined =>
  (splitKeyed(value, KEYED_SCHEME_PREFIX) ?? splitKeyed(value, KEYED_DIGEST_PREFIX))?.kid;

/** Encrypts with the keyring's primary key. */
export const encryptWithKeyring = async (content: string, keyring: Keyring): Promise<string> => {
  try {
    const header = `${KEYED_SCHEME_PREFIX}${keyring.primaryId}:`;
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const cipher = aesGcm(deriveKey(primaryKey(keyring), salt), iv, utf8ToBytes(header));
    const encrypted = cipher.encrypt(utf8ToBytes(content));
    return header + Buffer.from(concatBytes(salt, iv, encrypted)).toString('base64');
  } catch (error) {
    throw new EncryptError(error);
  }
};

/**
 * Decrypts any machine ciphertext the keyring holds a key for. Values without a
 * key id (m1 and legacy PBKDF2) are tried against each key, primary first;
 * AES-GCM authentication guarantees only the right key succeeds.
 */
export const decryptWithKeyring = async (value: string, keyring: Keyring): Promise<string> => {
  const keyed = splitKeyed(value, KEYED_SCHEME_PREFIX);
  if (keyed) {
    const key = keyring.keys.get(keyed.kid);
    if (key === undefined) {
      // The key was removed before every value written with it expired.
      throw new DecryptError(new Error('unknown machine key id'));
    }
    try {
      const data = Buffer.from(keyed.payload, 'base64');
      const salt = data.subarray(0, SALT_LENGTH);
      const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH);
      const header = utf8ToBytes(`${KEYED_SCHEME_PREFIX}${keyed.kid}:`);
      const decrypted = aesGcm(deriveKey(key, salt), iv, header).decrypt(ciphertext);
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new DecryptError(error);
    }
  }

  if (!value.startsWith(SCHEME_PREFIX) && !BASE64.test(value)) {
    throw new DecryptError(new Error('not a machine ciphertext'));
  }

  let lastError: unknown;
  for (const key of keyring.keys.values()) {
    try {
      return await decrypt(value, key);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof DecryptError ? lastError : new DecryptError(lastError);
};

/**
 * Whether a machine ciphertext was written with the keyring's primary key.
 * Values without a key id are checked by decrypting with the primary key.
 */
export const isOnPrimaryKey = async (value: string, keyring: Keyring): Promise<boolean> => {
  const kid = keyIdOf(value);
  if (kid !== undefined) {
    return kid === keyring.primaryId;
  }
  try {
    await decrypt(value, primaryKey(keyring));
    return true;
  } catch {
    return false;
  }
};

const keyedDigest = (value: string, digestKey: Uint8Array, kid: string, context: string) =>
  `${KEYED_DIGEST_PREFIX}${kid}:${rawDigest(value, digestKey, context)}`;

const primaryDigestKey = (keyring: Keyring): Uint8Array => {
  const digestKey = keyring.digestKeys.get(keyring.primaryId);
  if (digestKey === undefined) {
    throw new Error('machine keyring is missing its primary key');
  }
  return digestKey;
};

/** Deterministic keyed digest with the keyring's primary key. See {@link digest}. */
export const digestWithKeyring = (value: string, keyring: Keyring, context: string): string =>
  keyedDigest(value, primaryDigestKey(keyring), keyring.primaryId, context);

/**
 * The digests of `value` that `stored` could legitimately equal, computed in
 * `stored`'s own format. Only the stored format decides this, never the
 * caller, so a raw stored digest can't be submitted in place of `value`.
 *
 * - hm2: the digest under the key it names, or none if that key was removed.
 * - hm1: one digest per key, because hm1 doesn't record which key made it.
 * - anything else predates digests and is compared as-is.
 */
export const digestCandidates = (
  stored: string,
  value: string,
  keyring: Keyring,
  context: string,
): string[] => {
  const keyed = splitKeyed(stored, KEYED_DIGEST_PREFIX);
  if (keyed) {
    const digestKey = keyring.digestKeys.get(keyed.kid);
    return digestKey === undefined ? [] : [keyedDigest(value, digestKey, keyed.kid, context)];
  }
  if (isDigest(stored)) {
    return [...keyring.digestKeys.values()].map(
      (digestKey) => DIGEST_PREFIX + rawDigest(value, digestKey, context),
    );
  }
  return [value];
};
