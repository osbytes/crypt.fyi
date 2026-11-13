import type { Redis } from 'ioredis';
import { machine } from '@crypt.fyi/core';
import { VAULT_KEY_PREFIX } from './redis.js';

// Re-encrypts vault metadata with the keyring's primary key and reports how
// long the previous keys are still needed.
//
// Encrypted fields (IP restrictions, webhook URL, delete token) are rewrapped:
// decrypted with whichever key wrote them and encrypted with the primary key.
// The verification-hash digest cannot be rewrapped, because the server never
// learns the hash itself, only a keyed digest of it. Entries whose digest uses
// a previous key keep depending on that key until they expire, which is
// bounded by the max TTL. The report gives the time after which no entry can
// depend on a previous key any more.

type Entry = Record<string, unknown> & { wh?: Record<string, unknown> };

interface EncryptedField {
  name: 'ips' | 'dt' | 'wh.u';
  get: (entry: Entry) => unknown;
  set: (entry: Entry, value: string) => void;
}

const ENCRYPTED_FIELDS: readonly EncryptedField[] = [
  { name: 'ips', get: (e) => e.ips, set: (e, v) => void (e.ips = v) },
  { name: 'dt', get: (e) => e.dt, set: (e, v) => void (e.dt = v) },
  { name: 'wh.u', get: (e) => e.wh?.u, set: (e, v) => void (e.wh!.u = v) },
];

// Writes the new value only if the entry is unchanged since it was read, and
// keeps its remaining TTL. A concurrent read can decrement rc/fc or burn the
// entry; the CAS makes sure rotation never undoes that.
const COMPARE_AND_SET = `
local current = redis.call('get', KEYS[1])
if current ~= ARGV[1] then
  return 0
end
redis.call('set', KEYS[1], ARGV[2], 'KEEPTTL')
return 1
`;

const MAX_ATTEMPTS = 3;

// Key ids are derived from the keys, so the report shows only how many keys
// are loaded: an id would let anyone reading the output check guesses of a
// weak key offline.
export interface RotationReport {
  previousKeyCount: number;
  dryRun: boolean;
  /** Vault entries examined. */
  scanned: number;
  /** Entries whose encrypted fields were (or, in a dry run, would be) re-encrypted. */
  rewrapped: number;
  /** Entries that changed or expired while being rotated on every attempt; rerun to pick them up. */
  conflicts: number;
  /** Entries holding a value no loaded key can decrypt. Their data is already lost. */
  unreadable: number;
  /** Entries that still need a previous key after this run (digest or unrewrapped field). */
  dependentOnPreviousKeys: number;
  /**
   * When the last entry depending on a previous key expires. Previous keys can
   * be removed after this time, once the webhook queue is also clear. Null when
   * nothing depends on them.
   */
  previousKeysNeededUntil: string | null;
  /** Dependent entries without a TTL; previous keys stay needed until they are deleted. */
  dependentWithoutTtl: number;
}

type EntryOutcome =
  | { kind: 'gone' }
  | { kind: 'conflict' }
  | { kind: 'unreadable'; pttl: number }
  | { kind: 'ok'; rewrapped: boolean; dependent: boolean; pttl: number };

const rotateEntry = async (
  redis: Redis,
  key: string,
  keyring: machine.Keyring,
  dryRun: boolean,
): Promise<EntryOutcome> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const [[, raw], [, pttl]] = (await redis.multi().get(key).pttl(key).exec()) as [
      [unknown, string | null],
      [unknown, number],
    ];
    if (raw === null) {
      return { kind: 'gone' };
    }

    let entry: Entry;
    try {
      entry = JSON.parse(raw);
    } catch {
      return { kind: 'unreadable', pttl };
    }

    let changed = false;
    let dependent = false;
    let unreadable = false;
    for (const field of ENCRYPTED_FIELDS) {
      const value = field.get(entry);
      if (typeof value !== 'string' || machine.keyIdOf(value) === keyring.primaryId) {
        continue;
      }
      // Delete tokens written before they were encrypted are plaintext and
      // carry no machine prefix; the server still reads them as-is. Unprefixed
      // ips or webhook URLs may be legacy PBKDF2 ciphertext, so those are tried.
      if (field.name === 'dt' && !machine.isEncrypted(value)) {
        continue;
      }
      try {
        const plaintext = await machine.decryptWithKeyring(value, keyring);
        field.set(entry, await machine.encryptWithKeyring(plaintext, keyring));
        changed = true;
        // A dry run rewrites nothing, so a field still on a previous key keeps
        // depending on it. m1 values on the primary key are rewrapped only to
        // gain a key id and depend on nothing else.
        if (dryRun && !(await machine.isOnPrimaryKey(value, keyring))) {
          dependent = true;
        }
      } catch {
        // IP restrictions written before they were encrypted are plaintext,
        // which the server also tolerates.
        if (field.name === 'ips' && !machine.isEncrypted(value)) {
          continue;
        }
        unreadable = true;
      }
    }

    // An hm1 digest doesn't record its key, and checking it needs the original
    // hash, so it can only depend on a previous key if the keyring has one.
    const h = entry.h;
    if (
      typeof h === 'string' &&
      machine.isDigest(h) &&
      machine.keyIdOf(h) !== keyring.primaryId &&
      machine.hasPreviousKeys(keyring)
    ) {
      dependent = true;
    }

    if (unreadable) {
      return { kind: 'unreadable', pttl };
    }
    if (!changed || dryRun) {
      return { kind: 'ok', rewrapped: changed, dependent, pttl };
    }

    const written = await redis.eval(COMPARE_AND_SET, 1, key, raw, JSON.stringify(entry));
    if (written === 1) {
      return { kind: 'ok', rewrapped: true, dependent, pttl };
    }
  }
  return { kind: 'conflict' };
};

export const rotateVaultKeys = async ({
  redis,
  keyring,
  dryRun = false,
  scanCount = 500,
  now = Date.now(),
}: {
  redis: Redis;
  keyring: machine.Keyring;
  dryRun?: boolean;
  scanCount?: number;
  now?: number;
}): Promise<RotationReport> => {
  const report: RotationReport = {
    previousKeyCount: keyring.keys.size - 1,
    dryRun,
    scanned: 0,
    rewrapped: 0,
    conflicts: 0,
    unreadable: 0,
    dependentOnPreviousKeys: 0,
    previousKeysNeededUntil: null,
    dependentWithoutTtl: 0,
  };
  let maxDependentPttl = -1;
  // SCAN may return a key more than once; count each entry once.
  const seen = new Set<string>();

  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${VAULT_KEY_PREFIX}*`,
      'COUNT',
      scanCount,
    );
    cursor = next;
    for (const key of keys) {
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const outcome = await rotateEntry(redis, key, keyring, dryRun);
      if (outcome.kind === 'gone') {
        continue;
      }
      report.scanned++;
      if (outcome.kind === 'conflict') {
        report.conflicts++;
        continue;
      }
      if (outcome.kind === 'unreadable') {
        report.unreadable++;
        continue;
      }
      if (outcome.rewrapped) {
        report.rewrapped++;
      }
      if (outcome.dependent) {
        report.dependentOnPreviousKeys++;
        if (outcome.pttl < 0) {
          report.dependentWithoutTtl++;
        } else {
          maxDependentPttl = Math.max(maxDependentPttl, outcome.pttl);
        }
      }
    }
  } while (cursor !== '0');

  if (maxDependentPttl >= 0) {
    report.previousKeysNeededUntil = new Date(now + maxDependentPttl).toISOString();
  }
  return report;
};

/**
 * Counts queued webhook jobs that are still encrypted with a previous key.
 * Jobs live for at most their retry window, so these are left to drain rather
 * than rewritten inside BullMQ's own data structures.
 */
export const countWebhookJobsOnPreviousKeys = async (
  jobData: readonly string[],
  keyring: machine.Keyring,
): Promise<number> => {
  let count = 0;
  for (const data of jobData) {
    if (!(await machine.isOnPrimaryKey(data, keyring))) {
      count++;
    }
  }
  return count;
};
