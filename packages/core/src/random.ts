import { randomBytes } from '@noble/hashes/utils';

export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return randomBytes(length);
}

export async function generateRandomHexString(length: number): Promise<string> {
  const bytes = await generateRandomBytes(length);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// https://stackoverflow.com/questions/695438/what-are-the-safe-characters-for-making-urls
export const URL_SAFE_DICTIONARY = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~`;

// The following implementation guarantees uniformly distributed cryptographically random
// string generation for any dictionary input length as described by https://arxiv.org/pdf/1304.1916
export async function generateRandomString(
  length: number,
  dictionary: string = URL_SAFE_DICTIONARY,
): Promise<string> {
  const dictionaryLength = dictionary.length;
  const maxValid = Math.floor(256 / dictionaryLength) * dictionaryLength - 1;
  let result = '';

  while (result.length < length) {
    const bytes = await generateRandomBytes(length - result.length);

    for (const byte of bytes) {
      if (byte > maxValid) continue;

      result += dictionary.charAt(byte % dictionaryLength);
      if (result.length === length) break;
    }
  }

  return result;
}
