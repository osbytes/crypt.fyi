import { encrypt, decrypt, generateRandomString, generateRandomBytes } from './encryption';

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

describe('generateRandomString', () => {
  it("shouldn't generate the same string twice", async () => {
    const randomString1 = await generateRandomString(15);
    const randomString2 = await generateRandomString(15);
    expect(randomString1).not.toBe(randomString2);
  });

  it('should generate a random string of the specified length', async () => {
    const lengths = await generateRandomBytes(50);
    for (const length of Array.from(new Set(lengths))) {
      const randomString = await generateRandomString(length);
      expect(randomString.length).toBe(length);
    }
  });

  it('should generate all possible characters over time', async () => {
    const dictionary =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const sample = await generateRandomString(10_000, dictionary);
    for (const char of dictionary) {
      expect(sample).toContain(char);
    }
  });
});
