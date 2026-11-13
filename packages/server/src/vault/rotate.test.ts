import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Redis } from 'ioredis';
import { machine, type Vault } from '@crypt.fyi/core';
import { createRedisVault, getVaultKey } from './redis.js';
import { createTokenGenerator } from './tokens.js';
import { createNopWebhookSender } from '../webhook.js';
import { rotateVaultKeys, countWebhookJobsOnPreviousKeys } from './rotate.js';

const OLD_KEY = 'rotation-test-old-key-0123456789abcdef';
const NEW_KEY = 'rotation-test-new-key-fedcba9876543210';
const m = { encryption: { algorithm: 'aes-256-gcm' as const } };
// A separate logical database keeps SCAN from seeing other tests' entries.
const TEST_DB = 9;

describe('encryption key rotation', () => {
  let redis: Redis;

  const before = machine.createKeyring(OLD_KEY);
  const rotating = machine.createKeyring(NEW_KEY, [OLD_KEY]);
  const after = machine.createKeyring(NEW_KEY);

  const vaultWith = (keyring: machine.Keyring): Vault =>
    createRedisVault(
      redis,
      createTokenGenerator({ vaultEntryIdentifierLength: 20, vaultEntryDeleteTokenLength: 20 }),
      createNopWebhookSender(),
      keyring,
    );
  const stored = async (id: string) =>
    JSON.parse((await redis.get(getVaultKey(id)))!) as Record<string, unknown> & {
      wh: { u: string };
    };
  const create = (vault: Vault, fc?: number) =>
    vault.set({
      c: 'ciphertext',
      h: 'abc123',
      b: false,
      ttl: 60_000,
      m,
      fc,
      ips: '127.0.0.1',
      wh: { u: 'https://example.com/hook', r: false, fpk: false, fip: false, b: false },
    });

  beforeEach(async () => {
    redis = new Redis({ db: TEST_DB });
    await redis.flushdb();
  });

  afterEach(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  it('keeps entries written with the previous key readable and deletable', async () => {
    const a = await create(vaultWith(before));
    const b = await create(vaultWith(before));
    const vault = vaultWith(rotating);

    await expect(vault.get(a.id, 'abc123', '127.0.0.1')).resolves.toMatchObject({
      c: 'ciphertext',
    });
    await expect(vault.del(b.id, b.dt)).resolves.toBe(true);
  });

  it('still rejects a wrong hash on an entry written with the previous key', async () => {
    const { id } = await create(vaultWith(before), 2);
    await expect(vaultWith(rotating).get(id, 'wrong', '127.0.0.1')).rejects.toThrow();
    expect((await stored(id)).fc).toBe(1);
  });

  it('writes new entries with the primary key', async () => {
    const { id } = await create(vaultWith(rotating));
    const entry = await stored(id);
    for (const value of [entry.h, entry.dt, entry.ips, entry.wh.u]) {
      expect(machine.keyIdOf(value as string)).toBe(rotating.primaryId);
    }
    await expect(vaultWith(after).get(id, 'abc123', '127.0.0.1')).resolves.toBeDefined();
  });

  it('reads hm1/m1 entries written before key ids existed', async () => {
    const id = 'pre-keyring-entry';
    await redis.set(
      getVaultKey(id),
      JSON.stringify({
        c: 'ciphertext',
        h: machine.digest('abc123', OLD_KEY, `vault-h:${id}`),
        b: false,
        dt: await machine.encrypt('the-delete-token', OLD_KEY),
        ttl: 60_000,
        cd: Date.now(),
        m,
      }),
      'PX',
      60_000,
    );
    const vault = vaultWith(rotating);

    await expect(vault.get(id, 'wrong', '127.0.0.1')).rejects.toThrow();
    await expect(vault.get(id, 'abc123', '127.0.0.1')).resolves.toBeDefined();
    await expect(vault.del(id, 'the-delete-token')).resolves.toBe(true);
  });

  it('rewraps encrypted fields, keeps the TTL and reports the digest dependency', async () => {
    const { id, dt } = await create(vaultWith(before), 3);
    const ttlBefore = await redis.pttl(getVaultKey(id));
    const now = Date.now();

    const report = await rotateVaultKeys({ redis, keyring: rotating, now });

    expect(report).toMatchObject({
      primaryKeyId: rotating.primaryId,
      previousKeyIds: [before.primaryId],
      scanned: 1,
      rewrapped: 1,
      unreadable: 0,
      conflicts: 0,
      dependentOnPreviousKeys: 1,
      dependentWithoutTtl: 0,
    });
    const neededUntil = Date.parse(report.previousKeysNeededUntil!);
    expect(neededUntil).toBeGreaterThan(now);
    expect(neededUntil).toBeLessThanOrEqual(now + ttlBefore);

    const entry = await stored(id);
    expect(machine.keyIdOf(entry.dt as string)).toBe(rotating.primaryId);
    expect(machine.keyIdOf(entry.ips as string)).toBe(rotating.primaryId);
    expect(machine.keyIdOf(entry.wh.u)).toBe(rotating.primaryId);
    // The digest can't be recomputed without the hash, so it keeps the old key.
    expect(machine.keyIdOf(entry.h as string)).toBe(before.primaryId);
    expect(entry.fc).toBe(3);
    expect(await redis.pttl(getVaultKey(id))).toBeGreaterThan(ttlBefore - 5_000);

    const vault = vaultWith(rotating);
    await expect(vault.get(id, 'abc123', '127.0.0.1')).resolves.toBeDefined();
    await expect(vault.del(id, dt)).resolves.toBe(true);
  });

  it('changes nothing in a dry run', async () => {
    const { id } = await create(vaultWith(before));
    const raw = await redis.get(getVaultKey(id));

    const report = await rotateVaultKeys({ redis, keyring: rotating, dryRun: true });

    expect(report).toMatchObject({ dryRun: true, rewrapped: 1, dependentOnPreviousKeys: 1 });
    expect(await redis.get(getVaultKey(id))).toBe(raw);
  });

  it('reports nothing depending on previous keys once entries use the primary key', async () => {
    await create(vaultWith(rotating));
    const report = await rotateVaultKeys({ redis, keyring: rotating });
    expect(report).toMatchObject({
      scanned: 1,
      rewrapped: 0,
      dependentOnPreviousKeys: 0,
      previousKeysNeededUntil: null,
    });
  });

  it('counts entries whose key was removed too early as unreadable and leaves them alone', async () => {
    const { id } = await create(vaultWith(before));
    const raw = await redis.get(getVaultKey(id));

    const report = await rotateVaultKeys({ redis, keyring: after });

    expect(report.unreadable).toBe(1);
    expect(await redis.get(getVaultKey(id))).toBe(raw);
  });

  it('fails a read without burning the entry when its key is not loaded', async () => {
    const { id } = await create(vaultWith(before), 1);
    await expect(vaultWith(after).get(id, 'abc123', '127.0.0.1')).rejects.toThrow();
    expect((await stored(id)).fc).toBe(1);
  });

  it('counts webhook jobs still encrypted with a previous key', async () => {
    const jobs = [
      await machine.encryptWithKeyring('{}', before),
      await machine.encryptWithKeyring('{}', rotating),
      await machine.encrypt('{}', OLD_KEY),
    ];
    expect(countWebhookJobsOnPreviousKeys(jobs, rotating)).toBe(2);
  });
});
