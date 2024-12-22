import { generateRandomString } from '@crypt.fyi/core';

export const createTokens = async ({
  vaultEntryIdentifierLength,
  vaultEntryDeleteTokenLength,
}: {
  vaultEntryIdentifierLength: number;
  vaultEntryDeleteTokenLength: number;
}) => {
  const [id, dt] = await Promise.all([
    await generateRandomString(vaultEntryIdentifierLength),
    await generateRandomString(vaultEntryDeleteTokenLength),
  ]);
  return { id, dt };
};
