import { randomBytes } from "node:crypto";
import { promisify } from "node:util";
import z from "zod";
import { Config } from "../config";

const randomBytesAsync = promisify(randomBytes);

export const vaultValueSchema = z.object({
  c: z.string().describe("encrypted content"),
  b: z.boolean().describe("burn after reading"),
  p: z.boolean().describe("password was set"),
  dt: z.string().describe("delete token"),
  _cd: z.number().describe("created date"),
});
export type VaultValue = z.infer<typeof vaultValueSchema>;

export interface Vault {
  set(
    value: Omit<VaultValue, "dt" | "_cd"> & { ttl: number },
  ): Promise<{ id: string; dt: string }>;
  get(id: string): Promise<Omit<VaultValue, "dt" | "_cd"> | undefined>;
  del(id: string, dt: string): Promise<boolean>;
}

export const createTokens = async (config: Config) => {
  const [id, dt] = await Promise.all([
    (await randomBytesAsync(config.vaultEntryIdentifierLength)).toString(
      "base64url",
    ).slice(0, config.vaultEntryIdentifierLength),
    (await randomBytesAsync(config.vaultEntryDeleteTokenLength)).toString(
      "base64url",
    ).slice(0, config.vaultEntryDeleteTokenLength),
  ]);
  return { id, dt };
};
