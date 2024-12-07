import Redis from 'ioredis';
import {
  InvalidKeyAndOrPasswordError,
  Vault,
  VaultValue,
  createTokens,
  vaultValueSchema,
} from './vault';
import { isDefined } from '../util';
import { Config } from '../config';

export const createRedisVault = (redis: Redis, config: Config): Vault => {
  const getKey = (id: string) => `vault:${id}`;

  return {
    async set(value) {
      const { c, h, b, ttl } = value;
      const { id, dt } = await createTokens(config);

      const key = getKey(id);

      const tx = redis.multi();
      tx.setnx(
        key,
        JSON.stringify({
          c,
          h,
          b,
          dt,
          ttl,
          cd: Date.now(),
        } satisfies VaultValue),
      );
      tx.pexpire(key, ttl);
      const result = await tx.exec();
      if (!result) {
        throw new Error('unexpected null result');
      }

      if (result[0][1] !== 1) {
        throw new Error('something went wrong');
      }

      const errors = result.map((v) => v[0]).filter(isDefined);
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      return { id, dt };
    },
    async get(id, h) {
      const key = getKey(id);

      const result = (await redis.eval(
        // https://redis.io/docs/latest/develop/interact/programmability/lua-api/
        // https://redis.io/docs/latest/develop/interact/programmability/lua-api/#cjson-library
        `
  local value = redis.call('get', KEYS[1])
  if not value then
    return nil
  end

  local data = cjson.decode(value)
  if data.h ~= ARGV[1] then
    return false
  end

  if data.b == true then
    redis.call('del', KEYS[1])
  end

  return value
`,
        1,
        key,
        h,
      )) as string | null | false;
      if (!result) {
        if (result === false) {
          throw new InvalidKeyAndOrPasswordError();
        }
        return undefined;
      }

      const { c, b, ttl, cd } = vaultValueSchema.parse(JSON.parse(result));
      return {
        c,
        b,
        ttl,
        cd,
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
