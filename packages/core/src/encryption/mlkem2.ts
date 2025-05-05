import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBytes } from '@noble/post-quantum/utils';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { sha3_512 } from '@noble/hashes/sha3';
import { chacha20poly1305 } from '@noble/ciphers/chacha';
import { Buffer } from '../buffer';
import { Decrypt, Encrypt, DecryptError, EncryptError } from './encryption';

const IV_LENGTH = 12;
const CIPHERTEXT_LENGTH = 1088;
const SALT_LENGTH = 32;

const deriveKey = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  const passwordBytes = utf8ToBytes(password);
  const key = await sha3_512(concatBytes(passwordBytes, salt));
  return key;
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
