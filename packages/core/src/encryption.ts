import { gcm } from '@noble/ciphers/aes';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Buffer } from 'buffer';

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const ITERATIONS = 2 ** 19;

export async function encrypt(content: string, password: string): Promise<string> {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const key = await pbkdf2Async(sha256, utf8ToBytes(password), salt, {
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
}

export async function decrypt(encryptedContent: string, password: string): Promise<string> {
  try {
    const data = Buffer.from(encryptedContent, 'base64');
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH);

    const key = await pbkdf2Async(sha256, utf8ToBytes(password), salt, {
      c: ITERATIONS,
      dkLen: KEY_LENGTH,
    });

    const cipher = gcm(key, iv);
    const decrypted = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptError(error);
  }
}

export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return randomBytes(length);
}

export async function generateRandomHexString(length: number): Promise<string> {
  const bytes = await generateRandomBytes(length);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const dictionary = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export async function generateRandomString(length: number): Promise<string> {
  const dictionaryLength = dictionary.length;
  const bytes = await generateRandomBytes(length);
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % dictionaryLength;
    result += dictionary.charAt(randomIndex);
  }

  return result;
}

export class DecryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('decrypt error');
    this.name = 'DecryptError';
    this.error = error;
  }
}

export class EncryptError extends Error {
  error: unknown;
  constructor(error: unknown) {
    super('encrypt error');
    this.name = 'EncryptError';
    this.error = error;
  }
}
