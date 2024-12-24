import { promisify } from 'node:util';
import { deflate, inflate } from 'node:zlib';
import { Vault, VaultValue, encrypt, decrypt } from '@crypt.fyi/core';

const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

export class EncryptedVault implements Vault {
  constructor(
    private readonly vault: Vault,
    private readonly encryptionKey: string,
  ) {}

  async set(
    value: Omit<VaultValue, 'dt' | 'cd'> & { ttl: number },
  ): Promise<{ id: string; dt: string }> {
    const encryptedContent = await encrypt(value.c, this.encryptionKey);
    const deflatedContent = (await deflateAsync(encryptedContent)).toString('base64');
    const { id, dt } = await this.vault.set({
      ...value,
      c: deflatedContent,
    });
    return { id, dt };
  }

  async get(id: string, h: string, ip: string): Promise<Omit<VaultValue, 'dt' | 'h'> | undefined> {
    const value = await this.vault.get(id, h, ip);
    if (!value) {
      return undefined;
    }
    const inflatedContent = (await inflateAsync(Buffer.from(value.c, 'base64'))).toString();
    const decryptedContent = await decrypt(inflatedContent, this.encryptionKey);
    return {
      ...value,
      c: decryptedContent,
    };
  }

  async del(id: string, dt: string): Promise<boolean> {
    return this.vault.del(id, dt);
  }

  async exists(id: string): Promise<boolean> {
    return this.vault.exists(id);
  }
}
