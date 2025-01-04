import { generateRandomString, generateRandomBytes } from './random';

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
