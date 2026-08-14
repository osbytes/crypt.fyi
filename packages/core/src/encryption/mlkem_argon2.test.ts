import { encrypt, decrypt } from './mlkem_argon2';

describe('ml-kem-768-argon2', () => {
  it('round-trips, is non-deterministic, and rejects the wrong password', async () => {
    const password = 'correct horse battery staple';
    const enc = await encrypt('top secret', password);
    expect(await decrypt(enc, password)).toBe('top secret');

    const again = await encrypt('top secret', password);
    expect(again).not.toBe(enc);

    await expect(decrypt(enc, 'wrong')).rejects.toThrow();
  });
});
