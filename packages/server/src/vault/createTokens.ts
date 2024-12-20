import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const randomBytesAsync = promisify(randomBytes);

export const createTokens = async ({
  vaultEntryIdentifierLength,
  vaultEntryDeleteTokenLength,
}: {
  vaultEntryIdentifierLength: number;
  vaultEntryDeleteTokenLength: number;
}) => {
  const [id, dt] = await Promise.all([
    (await randomBytesAsync(vaultEntryIdentifierLength))
      .toString('base64url')
      .slice(0, vaultEntryIdentifierLength),
    (await randomBytesAsync(vaultEntryDeleteTokenLength))
      .toString('base64url')
      .slice(0, vaultEntryDeleteTokenLength),
  ]);
  return { id, dt };
};
