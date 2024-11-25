import Redis from "ioredis";
import { Vault, VaultValue, createTokens, vaultValueSchema } from "./vault";
import { isDefined } from "../util";
import { retryable } from "../retry";
import { Config } from "../config";
import { Logger } from "../logging";

export const createRedisVault = (
  redis: Redis,
  config: Config,
  logger: Logger,
): Vault => {
  const getKey = (id: string) => `vault:${id}`;

  return {
    async set(value) {
      const { c, h, b, p, ttl } = value;
      const { id, dt } = await createTokens(config);

      const key = getKey(id);

      const tx = redis.multi();
      tx.setnx(
        key,
        JSON.stringify({
          c,
          h,
          b,
          p,
          dt,
          _cd: Date.now(),
        } satisfies VaultValue),
      );
      tx.pexpire(key, ttl);
      const result = await tx.exec();
      if (!result) {
        throw new Error("unexpected null result");
      }

      if (result[0][1] !== 1) {
        throw new Error("something went wrong");
      }

      const errors = result.map((v) => v[0]).filter(isDefined);
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }

      return { id, dt };
    },
    async get(id, h) {
      const key = getKey(id);
      const result = await redis.get(key);
      if (!result) {
        return undefined;
      }

      const {
        c,
        h: actualH,
        b,
        p,
      } = vaultValueSchema.parse(JSON.parse(result));
      if (actualH !== h) {
        return undefined;
      }

      if (b) {
        retryable(() => redis.del(key), { retries: 3 }).catch((err) => {
          logger.error(`error deleting key ${id}`, err);
        });
      }

      return {
        c,
        b,
        p,
      };
    },
    async del(id, dt) {
      const key = getKey(id);
      const result = await redis.get(key);
      if (!result) {
        return false;
      }

      const { dt: actualDt } = vaultValueSchema.parse(JSON.parse(result));
      if (dt !== actualDt) {
        return false;
      }

      const delResult = await redis.del(key);

      return delResult === 1;
    },
  };
};
