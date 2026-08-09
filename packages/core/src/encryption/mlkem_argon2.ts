import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBytes } from '@noble/post-quantum/utils';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { argon2idAsync } from '@noble/hashes/argon2';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { Buffer } from '../buffer';
import { getArgon2ContentParams } from '../kdf';
import { Decrypt, Encrypt, DecryptError, EncryptError } from './encryption';

// ml-kem-768-argon2: identical construction to ml-kem-768-2 (ML-KEM-768 KEM +
// ChaCha20-Poly1305) but the password/key is stretched with Argon2id instead of
// a single SHA3-512. This is the layer that protects user-chosen passwords, so a
// memory-hard KDF materially raises the cost of offline brute-force.
//
// Argon2id parameters follow the OWASP minimum for interactive use, tuned to
// stay usable in-browser with the pure-JS noble implementation. See kdf.ts.
const IV_LENGTH = 12;
const CIPHERTEXT_LENGTH = 1088;
const SALT_LENGTH = 32;

const deriveKey = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  return argon2idAsync(utf8ToBytes(password), salt, getArgon2ContentParams());
};

export const encrypt: Encrypt = async (content: string, password: string) => {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await deriveKey(password, salt);
    const keyPair = ml_kem768.keygen(derivedKey);
    const { cipherText, sharedSecret } = ml_kem768.encapsulate(keyPair.publicKey);
    const iv = randomBytes(IV_LENGTH);
    const encryptedContent = chacha20poly1305(sharedSecret, iv).encrypt(utf8ToBytes(content));

    const result = concatBytes(salt, cipherText, iv, encryptedContent);
    return Buffer.from(result).toString('base64');
  } catch (error) {
    throw new EncryptError(error);
  }
};

export const decrypt: Decrypt = async (encryptedContent: string, password: string) => {
  try {
    const data = Buffer.from(encryptedContent, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const cipherText = data.subarray(SALT_LENGTH, SALT_LENGTH + CIPHERTEXT_LENGTH);
    const iv = data.subarray(
      SALT_LENGTH + CIPHERTEXT_LENGTH,
      SALT_LENGTH + CIPHERTEXT_LENGTH + IV_LENGTH,
    );
    const encrypted = data.subarray(SALT_LENGTH + CIPHERTEXT_LENGTH + IV_LENGTH);

    const derivedKey = await deriveKey(password, salt);
    const keyPair = ml_kem768.keygen(derivedKey);
    const sharedSecret = ml_kem768.decapsulate(cipherText, keyPair.secretKey);
    const decrypted = chacha20poly1305(sharedSecret, iv).decrypt(encrypted);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptError(error);
  }
};
