import { Vault, VaultValue } from './vault';
import { encrypt, decrypt } from '../encryption';

export class EncryptedVault implements Vault {
  constructor(
    private readonly vault: Vault,
    private readonly encryptionKey: string,
  ) {}

  async set(
    value: Omit<VaultValue, 'dt' | 'cd'> & { ttl: number },
  ): Promise<{ id: string; dt: string }> {
    const encryptedContent = await encrypt(value.c, this.encryptionKey);
    const { id, dt } = await this.vault.set({
      ...value,
      c: encryptedContent,
    });
    return { id, dt };
  }

  async get(id: string, h: string): Promise<Omit<VaultValue, 'dt' | 'h'> | undefined> {
    const value = await this.vault.get(id, h);
    if (!value) {
      return undefined;
    }
    const decryptedContent = await decrypt(value.c, this.encryptionKey);
    return {
      ...value,
      c: decryptedContent,
    };
  }

  async del(id: string, dt: string): Promise<boolean> {
    return this.vault.del(id, dt);
  }
}