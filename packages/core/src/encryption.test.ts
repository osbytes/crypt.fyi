import { encrypt, decrypt } from './encryption';

describe('encryption', () => {
  const testData = 'Hello, World!';
  const testPassword = 'test-password-123';

  it('should successfully encrypt and decrypt data', async () => {
    const encrypted = await encrypt(testData, testPassword);
    expect(encrypted).not.toBe(testData);

    const decrypted = await decrypt(encrypted, testPassword);
    expect(decrypted).toBe(testData);
  });

  it('should fail to decrypt with wrong password', async () => {
    const encrypted = await encrypt(testData, testPassword);

    await expect(decrypt(encrypted, 'wrong-password')).rejects.toThrow();
  });
});
