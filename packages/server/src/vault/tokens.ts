import { generateRandomString } from '@crypt.fyi/core';

export interface TokenGenerator {
  generate(): Promise<{ id: string; dt: string }>;
}

export const createTokenGenerator = ({
  vaultEntryIdentifierLength,
  vaultEntryDeleteTokenLength,
}: {
  vaultEntryIdentifierLength: number;
  vaultEntryDeleteTokenLength: number;
}): TokenGenerator => {
  return {
    generate: async () => {
      const [id, dt] = await Promise.all([
        await generateRandomString(vaultEntryIdentifierLength),
        await generateRandomString(vaultEntryDeleteTokenLength),
      ]);
      return { id, dt };
    },
  };
};
