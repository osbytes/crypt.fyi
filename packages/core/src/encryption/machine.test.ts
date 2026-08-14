import { encrypt, decrypt } from './machine';
import { encrypt as gcmEncrypt } from './gcm';

describe('machine cipher', () => {
  const key = 'a-high-entropy-machine-key-0123456789';

  it('round-trips content', async () => {
    const plaintext = 'https://hooks.example.com/webhook?x=1';
    const enc = await encrypt(plaintext, key);
    expect(enc.startsWith('m1:')).toBe(true);
    expect(await decrypt(enc, key)).toBe(plaintext);
  });

  it('produces distinct ciphertexts for the same input (random salt+iv)', async () => {
    const a = await encrypt('same', key);
    const b = await encrypt('same', key);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong key', async () => {
    const enc = await encrypt('secret', key);
    await expect(decrypt(enc, 'wrong-key')).rejects.toThrow();
  });

  it('transparently decrypts legacy PBKDF2 (gcm) ciphertext', async () => {
    const plaintext = '10.0.0.0/8,192.168.1.1';
    const legacy = await gcmEncrypt(plaintext, key);
    expect(legacy.startsWith('m1:')).toBe(false);
    expect(await decrypt(legacy, key)).toBe(plaintext);
  });
});
