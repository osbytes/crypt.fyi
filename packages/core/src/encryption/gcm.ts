import { gcm } from '@noble/ciphers/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2';
import { randomBytes } from '@noble/hashes/utils';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Decrypt, Encrypt, DecryptError, EncryptError } from './encryption';
import { Buffer } from '../buffer';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const ITERATIONS = 2 ** 19;

export const encrypt: Encrypt = async (content, password) => {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const key = await pbkdf2Async(nobleSha256, utf8ToBytes(password), salt, {
      c: ITERATIONS,
      dkLen: KEY_LENGTH,
    });
    const iv = randomBytes(IV_LENGTH);
    const cipher = gcm(key, iv);
    const encrypted = cipher.encrypt(utf8ToBytes(content));

    const result = concatBytes(salt, iv, encrypted);
    return Buffer.from(result).toString('base64');
  } catch (error) {
    throw new EncryptError(error);
  }
};

export const decrypt: Decrypt = async (encryptedContent, password) => {
  try {
    const data = Buffer.from(encryptedContent, 'base64');
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH);

    const key = await pbkdf2Async(nobleSha256, utf8ToBytes(password), salt, {
      c: ITERATIONS,
      dkLen: KEY_LENGTH,
    });

    const cipher = gcm(key, iv);
    const decrypted = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptError(error);
  }
};
