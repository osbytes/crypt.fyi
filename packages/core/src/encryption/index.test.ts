import { gcm, mlkem, mlkem2 } from './';

const algorithms = [
  {
    name: 'gcm',
    encrypt: gcm.encrypt,
    decrypt: gcm.decrypt,
  },
  {
    name: 'mlkem',
    encrypt: mlkem.encrypt,
    decrypt: mlkem.decrypt,
  },
  {
    name: 'mlkem2',
    encrypt: mlkem2.encrypt,
    decrypt: mlkem2.decrypt,
  },
];

describe('encryption', () => {
  const testData = 'Hello, World!';
  const testPassword = 'test-password-123';

  it.each(algorithms)(
    'should round-trip and fail decrypt with wrong password $name',
    async (algorithm) => {
      const encrypted = await algorithm.encrypt(testData, testPassword);
      expect(encrypted).not.toBe(testData);
      expect(await algorithm.decrypt(encrypted, testPassword)).toBe(testData);
      await expect(algorithm.decrypt(encrypted, 'wrong-password')).rejects.toThrow();
    },
  );
});
