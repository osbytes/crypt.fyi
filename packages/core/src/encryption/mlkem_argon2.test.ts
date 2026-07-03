import { encrypt, decrypt } from './mlkem_argon2';

describe('ml-kem-768-argon2', () => {
  it('round-trips content with a password', async () => {
    const enc = await encrypt('top secret', 'correct horse battery staple');
    expect(await decrypt(enc, 'correct horse battery staple')).toBe('top secret');
  });

  it('produces distinct ciphertexts for the same input', async () => {
    const a = await encrypt('same', 'pw');
    const b = await encrypt('same', 'pw');
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong password', async () => {
    const enc = await encrypt('secret', 'right');
    await expect(decrypt(enc, 'wrong')).rejects.toThrow();
  });
});
