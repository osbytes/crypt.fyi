import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBytes } from '@noble/post-quantum/utils';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils';
import { Buffer } from '../buffer';
import { Decrypt, Encrypt, DecryptError, EncryptError } from './encryption';
import { gcm } from '@noble/ciphers/aes';
import { sha512 } from '@noble/hashes/sha512';

const IV_LENGTH = 12;
const CIPHERTEXT_LENGTH = 1088;

export const encrypt: Encrypt = async (content: string, password: string) => {
  try {
    const passwordBytes = utf8ToBytes(password);
    const seed = sha512(passwordBytes);
    const derivedKeyPair = ml_kem768.keygen(seed);

    const { cipherText, sharedSecret } = ml_kem768.encapsulate(derivedKeyPair.publicKey);

    const iv = randomBytes(IV_LENGTH);
    const cipher = gcm(sharedSecret, iv);
    const encryptedContent = cipher.encrypt(utf8ToBytes(content));

    const result = concatBytes(cipherText, iv, encryptedContent);

    return Buffer.from(result).toString('base64');
  } catch (error) {
    throw new EncryptError(error);
  }
};

export const decrypt: Decrypt = async (encryptedContent: string, password: string) => {
  try {
    const data = Buffer.from(encryptedContent, 'base64');

    const cipherText = data.subarray(0, CIPHERTEXT_LENGTH);
    const iv = data.subarray(CIPHERTEXT_LENGTH, CIPHERTEXT_LENGTH + IV_LENGTH);
    const encrypted = data.subarray(CIPHERTEXT_LENGTH + IV_LENGTH);

    const passwordBytes = utf8ToBytes(password);
    const seed = sha512(passwordBytes);
    const derivedKeyPair = ml_kem768.keygen(seed);
    const sharedSecret = ml_kem768.decapsulate(cipherText, derivedKeyPair.secretKey);

    const cipher = gcm(sharedSecret, iv);
    const decrypted = cipher.decrypt(encrypted);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new DecryptError(error);
  }
};
