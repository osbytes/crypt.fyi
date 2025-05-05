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

  it.each(algorithms)('should successfully encrypt and decrypt data $name', async (algorithm) => {
    const encrypted = await algorithm.encrypt(testData, testPassword);
    expect(encrypted).not.toBe(testData);

    const decrypted = await algorithm.decrypt(encrypted, testPassword);
    expect(decrypted).toBe(testData);
  });

  it.each(algorithms)('should fail to decrypt with wrong password $name', async (algorithm) => {
    const encrypted = await algorithm.encrypt(testData, testPassword);

    await expect(algorithm.decrypt(encrypted, 'wrong-password')).rejects.toThrow();
  });
});
