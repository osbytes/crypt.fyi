import { randomBytes } from "node:crypto";
import { promisify } from "node:util";
import z from "zod";

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

export const createTokens = async () => {
  const [id, dt] = await Promise.all([
    // TODO: env configurable lengths on these
    (await randomBytesAsync(15)).toString("base64url"),
    (await randomBytesAsync(28)).toString("base64url"),
  ]);
  return { id, dt };
};
