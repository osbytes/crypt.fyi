import { timingSafeEqual } from 'node:crypto';
import { Redis } from 'ioredis';
import type { TokenGenerator } from './tokens.js';
import {
  ErrorInvalidKeyAndOrPassword,
  type Vault,
  type VaultValue,
  vaultValueSchema,
  machine,
} from '@crypt.fyi/core';
import { isIpAllowed } from './ips.js';
import type { WebhookSender } from '../webhook.js';

const parseResult = async (result: string, keyring: machine.Keyring) => {
  const jsonParsed = JSON.parse(result);
  if ('wh' in jsonParsed && jsonParsed.wh.u) {
    jsonParsed.wh.u = await machine.decryptWithKeyring(jsonParsed.wh.u, keyring);
  }
  if (jsonParsed.ips) {
    try {
      const ips = await machine.decryptWithKeyring(jsonParsed.ips, keyring);
      jsonParsed.ips = ips;
    } catch {
      // ignore - this maintains backward compatibility with existing vault entries that don't have ips encrypted
    }
  }
  // Entries written before delete tokens were encrypted hold them in plaintext
  // and stay readable until they expire (at most the max TTL).
  if (typeof jsonParsed.dt === 'string' && machine.isEncrypted(jsonParsed.dt)) {
    jsonParsed.dt = await machine.decryptWithKeyring(jsonParsed.dt, keyring);
  }
  return vaultValueSchema.parse(jsonParsed);
};

export const VAULT_KEY_PREFIX = 'vault:';
export const getVaultKey = (id: string) => `${VAULT_KEY_PREFIX}${id}`;
// Binding the digest to the entry id stops a digest being moved between
// entries and hides whether two entries share a verification hash.
export const vaultHashContext = (id: string) => `vault-h:${id}`;

export const createRedisVault = (
  redis: Redis,
  tokenGenerator: TokenGenerator,
  webhookSender: WebhookSender,
  keyring: machine.Keyring,
): Vault => {
  return {
    async set(value) {
      const { c, h, b, ttl, ips, rc, wh, fc, m } = value;
      const { id, dt } = await tokenGenerator.generate();

      const key = getVaultKey(id);

      // The delete token is encrypted rather than digested because webhook
      // payloads must carry the original value back to the creator.
      const [encryptedIps, encryptedWhU, encryptedDt] = await Promise.all([
        ips ? machine.encryptWithKeyring(ips, keyring) : undefined,
        wh ? machine.encryptWithKeyring(wh.u, keyring) : undefined,
        machine.encryptWithKeyring(dt, keyring),
      ]);

      // Single atomic SET with NX + PX: only creates the key if absent AND sets
      // its TTL in the same command, so a (astronomically unlikely) ID collision
      // can never overwrite or re-expire an existing entry.
      const result = await redis.set(
        key,
        JSON.stringify({
          c,
          h: machine.digestWithKeyring(h, keyring, vaultHashContext(id)),
          b,
          fc,
          dt: encryptedDt,
          ttl,
          cd: Date.now(),
          m,
          ips: encryptedIps,
          rc,
          wh: wh && encryptedWhU ? { ...wh, u: encryptedWhU } : undefined,
        } satisfies VaultValue),
        'PX',
        ttl,
        'NX',
      );
      if (result !== 'OK') {
        throw new Error('vault id collision, please retry');
      }

      return { id, dt };
    },
    async get(id, h, ip) {
      const key = getVaultKey(id);

      // TODO: try to not pull the full redis entry into memory until the ip address is confirmed to be allowed
      const result = await redis.get(key);
      if (!result) {
        return undefined;
      }

      const { h: storedH, ips, c, b, ttl, cd, dt, wh, m } = await parseResult(result, keyring);
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

      // The stored format decides the comparison, never the request. Accepting
      // either form would let someone holding a Redis dump submit the stored
      // digest as `h`. Entries without a digest predate this scheme and expire
      // within the max TTL. During a key rotation an hm1 digest may have been
      // made with any key in the ring, so every candidate is checked.
      const expectedHs = machine.digestCandidates(storedH, h, keyring, vaultHashContext(id));
      if (expectedHs.length === 0) {
        // The entry's key was removed from the keyring. Failing here keeps a
        // server misconfiguration from counting as a wrong password and
        // burning the entry through its failed-attempt limit.
        throw new Error('vault entry digest was made with an encryption key that is not loaded');
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
  local matched = false
  for i = 1, #ARGV do
    if data.h == ARGV[i] then
      matched = true
      break
    end
  end
  if not matched then
    -- Handle failed attempts
    if data.fc then
      data.fc = (data.fc or 0) - 1
      if data.fc <= 0 then
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
        ...expectedHs,
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
        const ts = Date.now();
        if (wh?.fpk) {
          void webhookSender.send({
            url: wh.u,
            name: wh.n,
            event: 'FAILURE_KEY_PASSWORD',
            id,
            dt,
            ts,
          });
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
        m,
      };
    },
    async del(id, dt) {
      const key = getVaultKey(id);
      const result = await redis.get(key);
      if (!result) {
        return false;
      }

      const { dt: actualDt } = await parseResult(result, keyring);
      const dtBuf = Buffer.from(dt);
      const actualDtBuf = Buffer.from(actualDt);
      if (dtBuf.length !== actualDtBuf.length || !timingSafeEqual(dtBuf, actualDtBuf)) {
        return false;
      }

      const delResult = await redis.del(key);

      return delResult === 1;
    },
    async exists(id) {
      const key = getVaultKey(id);
      const result = await redis.exists(key);
      return result === 1;
    },
  };
};
