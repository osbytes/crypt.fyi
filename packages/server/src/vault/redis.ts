import Redis from 'ioredis';
import { TokenGenerator } from './tokens';
import {
  ErrorInvalidKeyAndOrPassword,
  Vault,
  VaultValue,
  vaultValueSchema,
  gcm,
} from '@crypt.fyi/core';
import { isDefined } from '../util';
import { isIpAllowed } from './ips';
import { WebhookSender } from '../webhook';

const parseResult = async (result: string, encryptionKey: string) => {
  const jsonParsed = JSON.parse(result);
  if ('wh' in jsonParsed && jsonParsed.wh.u) {
    jsonParsed.wh.u = await gcm.decrypt(jsonParsed.wh.u, encryptionKey);
  }
  return vaultValueSchema.parse(jsonParsed);
};

export const createRedisVault = (
  redis: Redis,
  tokenGenerator: TokenGenerator,
  webhookSender: WebhookSender,
  encryptionKey: string,
): Vault => {
  const getKey = (id: string) => `vault:${id}`;

  return {
    async set(value) {
      const { c, h, b, ttl, ips, rc, wh, fa } = value;
      const { id, dt } = await tokenGenerator.generate();

      const key = getKey(id);

      const tx = redis.multi();
      tx.setnx(
        key,
        JSON.stringify({
          c,
          h,
          b,
          fa,
          dt,
          ttl,
          cd: Date.now(),
          ips,
          rc,
          wh: wh
            ? {
                ...wh,
                u: await gcm.encrypt(wh.u, encryptionKey),
              }
            : undefined,
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
    async get(id, h, ip) {
      const key = getKey(id);

      // TODO: try to not pull the full redis entry into memory until the ip address is confirmed to be allowed
      const result = await redis.get(key);
      if (!result) {
        return undefined;
      }

      const { ips, c, b, ttl, cd, dt, wh } = await parseResult(result, encryptionKey);
      if (!isIpAllowed(ip, ips)) {
        if (wh?.fip) {
          void webhookSender.send({
            url: wh.u,
            name: wh.n,
            event: 'FAILURE_IP_ADDRESS',
            id,
            dt,
            ts: Date.now(),
          });
        }
        return undefined;
      }

      const outcome = (await redis.eval(
        // https://redis.io/docs/latest/develop/interact/programmability/lua-api/
        // https://redis.io/docs/latest/develop/interact/programmability/lua-api/#cjson-library
        `
  local value = redis.call('get', KEYS[1])
  if not value then
    return nil
  end

  local data = cjson.decode(value)
  if data.h ~= ARGV[1] then
    -- Handle failed attempts
    if data.fa then
      data.fa_count = (data.fa_count or 0) + 1
      if data.fa_count >= data.fa then
        redis.call('del', KEYS[1])
        return cjson.encode({ status = "invalid_hash", burned = true, reason = "failed_attempts" })
      else
        -- Get the remaining TTL before updating
        local remainingTTL = redis.call('pttl', KEYS[1])
        if remainingTTL > 0 then
          -- Update the stored value with incremented fa_count
          redis.call('set', KEYS[1], cjson.encode(data))
          -- Restore the remaining TTL
          redis.call('pexpire', KEYS[1], remainingTTL)
        end
      end
    end
    return cjson.encode({ status = "invalid_hash" })
  end

  local burned = false
  local reason = nil
  -- Handle read count logic
  if data.rc then
    data.rc = data.rc - 1
    if data.rc <= 0 then
      redis.call('del', KEYS[1])
      burned = true
      reason = "read_count_zero"
    else
      -- Get the remaining TTL before updating
      local remainingTTL = redis.call('pttl', KEYS[1])
      if remainingTTL > 0 then
        -- Update the stored value with decremented rc
        redis.call('set', KEYS[1], cjson.encode(data))
        -- Restore the remaining TTL
        redis.call('pexpire', KEYS[1], remainingTTL)
      else
        -- If TTL has expired or is invalid, delete the key
        redis.call('del', KEYS[1])
        burned = true
        reason = "ttl_expired"
      end
    end
    return cjson.encode({ status = "success", burned = burned, reason = reason })
  end

  if data.b == true then
    redis.call('del', KEYS[1])
    burned = true
    reason = "burned"
  end

  return cjson.encode({ status = "success", burned = burned, reason = reason })
`,
        1,
        key,
        h,
      )) as string | null;
      if (!outcome) {
        return undefined;
      }

      const redisOutcome = JSON.parse(outcome) as {
        status: 'invalid_hash' | 'success';
        burned?: boolean;
        reason?: 'read_count_zero' | 'burned' | 'ttl_expired' | 'failed_attempts';
      };
      if (redisOutcome.status === 'invalid_hash') {
        if (wh?.fpk || (redisOutcome.burned && wh?.b)) {
          void webhookSender.send({
            url: wh.u,
            name: wh.n,
            event: redisOutcome.burned ? 'BURN' : 'FAILURE_KEY_PASSWORD',
            id,
            dt,
            ts: Date.now(),
          });
        }
        throw new ErrorInvalidKeyAndOrPassword();
      }

      const ts = Date.now();

      if (redisOutcome.status === 'success') {
        if (wh?.r) {
          void webhookSender.send({
            url: wh.u,
            name: wh.n,
            event: 'READ',
            id,
            dt,
            ts,
          });
        }
      }

      if (redisOutcome.burned && wh?.b) {
        void webhookSender.send({
          url: wh.u,
          name: wh.n,
          event: 'BURN',
          id,
          dt,
          ts,
        });
      }

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

      const { dt: actualDt } = await parseResult(result, encryptionKey);
      if (dt !== actualDt) {
        return false;
      }

      const delResult = await redis.del(key);

      return delResult === 1;
    },
    async exists(id) {
      const key = getKey(id);
      const result = await redis.exists(key);
      return result === 1;
    },
  };
};
