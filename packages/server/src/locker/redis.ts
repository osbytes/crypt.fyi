import Redis from 'ioredis';
import { Locker, LockAcquisitionError, LockLostError } from './locker';
import { randomBytes } from 'crypto';
import { Logger, nopLogger } from '../logging';
import { sleep } from '@crypt.fyi/core';

export interface RedisLockerConfig {
  keyPrefix?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  extensionIntervalMs?: number;
  logger?: Logger;
}

export class RedisLocker implements Locker {
  private readonly keyPrefix: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly extensionIntervalMs: number;
  private readonly logger: Logger;

  private static readonly RELEASE_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  private static readonly EXTEND_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  private static readonly DEFAULT_RETRY_COUNT = 3;
  private static readonly DEFAULT_RETRY_DELAY_MS = 200;
  private static readonly DEFAULT_EXTENSION_INTERVAL_MS = 1000;
  private static readonly DEFAULT_KEY_PREFIX = 'lock';

  constructor(
    private readonly redis: Redis,
    config: RedisLockerConfig = {},
  ) {
    this.keyPrefix = config.keyPrefix ?? RedisLocker.DEFAULT_KEY_PREFIX;
    this.maxRetries = config.maxRetries ?? RedisLocker.DEFAULT_RETRY_COUNT;
    this.retryDelayMs = config.retryDelayMs ?? RedisLocker.DEFAULT_RETRY_DELAY_MS;
    this.extensionIntervalMs =
      config.extensionIntervalMs ?? RedisLocker.DEFAULT_EXTENSION_INTERVAL_MS;
    this.logger = config.logger ?? nopLogger;
  }

  private async extendLock(lockKey: string, lockId: string, ttl: number): Promise<boolean> {
    const extended = await this.redis.eval(RedisLocker.EXTEND_SCRIPT, 1, lockKey, lockId, ttl);
    return extended === 1;
  }

  private sanitizeKey(key: string): string {
    // Remove Redis-special characters and ensure safe key
    return encodeURIComponent(key).replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  async lock<T>(key: string, ttl: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const sanitizedKey = this.sanitizeKey(key);
    const lockId = randomBytes(16).toString('hex');
    const lockKey = `${this.keyPrefix}:${sanitizedKey}`;

    // Add safety margin to ensure extension happens well before expiry
    const extensionThreshold = Math.min((ttl * 1000) / 3, this.extensionIntervalMs);

    let acquired = false;
    let retryCount = 0;

    while (!acquired && retryCount <= this.maxRetries) {
      const result = await this.redis.set(lockKey, lockId, 'EX', ttl, 'NX');
      acquired = result === 'OK';

      if (!acquired) {
        if (retryCount === this.maxRetries) {
          throw new LockAcquisitionError(`Failed to acquire lock after ${this.maxRetries} retries`);
        }
        const delay = this.retryDelayMs * Math.pow(2, retryCount) * (0.5 + Math.random() * 0.5);
        await sleep(delay);
        retryCount++;
      }
    }

    let extensionIntervalMs: ReturnType<typeof setInterval> | null = null;
    let lockValid = true;

    const startExtension = (): AbortSignal => {
      const ab = new AbortController();
      extensionIntervalMs = setInterval(async () => {
        try {
          const extended = await this.extendLock(lockKey, lockId, ttl);
          if (!extended) {
            ab.abort();
            lockValid = false;
            if (extensionIntervalMs) {
              clearInterval(extensionIntervalMs);
              extensionIntervalMs = null;
            }
            this.logger.error('Lock extension failed: lock was lost');
          }
        } catch (error) {
          ab.abort();
          lockValid = false;
          this.logger.error({ error }, 'Failed to extend lock');
          if (extensionIntervalMs) {
            clearInterval(extensionIntervalMs);
            extensionIntervalMs = null;
          }
        }
      }, extensionThreshold);
      return ab.signal;
    };

    try {
      const signal = startExtension();
      const result = await fn(signal);

      // Verify lock wasn't lost during execution
      if (!lockValid) {
        throw new LockLostError('Lock was lost during execution');
      }

      return result;
    } finally {
      if (extensionIntervalMs) {
        clearInterval(extensionIntervalMs);
      }
      try {
        await this.redis.eval(RedisLocker.RELEASE_SCRIPT, 1, lockKey, lockId);
      } catch (error) {
        this.logger.error({ error }, 'Failed to release lock');
      }
    }
  }
}
