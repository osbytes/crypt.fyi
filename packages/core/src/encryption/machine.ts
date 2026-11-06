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

const deriveKey = (key: string, salt: Uint8Array): Uint8Array =>
  hkdf(sha256, utf8ToBytes(key), salt, HKDF_INFO, KEY_LENGTH);

export const isEncrypted = (value: string): boolean => value.startsWith(SCHEME_PREFIX);

export const isDigest = (value: string): boolean => value.startsWith(DIGEST_PREFIX);

/**
 * Deterministic keyed digest, for values that must be compared where the machine
 * key isn't available (such as inside a Redis script). `context` scopes the
 * digest to one use and must not contain a NUL byte, which separates it from
 * `value` so the pair is encoded unambiguously.
 */
export const digest = (value: string, key: string, context: string): string => {
  const digestKey = hkdf(sha256, utf8ToBytes(key), undefined, DIGEST_HKDF_INFO, KEY_LENGTH);
  const message = concatBytes(utf8ToBytes(context), new Uint8Array([0]), utf8ToBytes(value));
  return DIGEST_PREFIX + Buffer.from(hmac(sha256, digestKey, message)).toString('base64');
};

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
