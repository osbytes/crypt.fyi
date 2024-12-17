import { Buffer } from 'buffer';

export async function encrypt(content: string, password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    data,
  );

  const encryptedBytes = new Uint8Array(salt.byteLength + iv.byteLength + encryptedData.byteLength);
  encryptedBytes.set(salt, 0);
  encryptedBytes.set(iv, salt.byteLength);
  encryptedBytes.set(new Uint8Array(encryptedData), salt.byteLength + iv.byteLength);

  return Buffer.from(encryptedBytes).toString('base64');
}

export async function decrypt(content: string, password: string) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const encryptedBytes = Buffer.from(content, 'base64');

  const salt = encryptedBytes.subarray(0, 16);
  const iv = encryptedBytes.subarray(16, 28);
  const encryptedData = encryptedBytes.subarray(28);

  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt'],
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encryptedData,
  );

  // Convert decrypted data to string
  return decoder.decode(decryptedData);
}

export async function generateRandomBytes(length: number) {
  const randomBytes = new Uint8Array(length);
  window.window.crypto.getRandomValues(randomBytes);
  return randomBytes;
}

export async function generateRandomHexString(length: number): Promise<string> {
  const randomBytes = await generateRandomBytes(length);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const dictionary = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export async function generateRandomString(length: number): Promise<string> {
  const dictionaryLength = dictionary.length;
  const randomBytes = await generateRandomBytes(length);
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % dictionaryLength;
    randomString += dictionary.charAt(randomIndex);
  }

  return randomString;
}
