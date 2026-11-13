// Re-encrypts vault metadata with the primary ENCRYPTION_KEY and reports when
// the keys in ENCRYPTION_PREVIOUS_KEYS can be removed. See the "Rotating
// ENCRYPTION_KEY" section of the server README for the full procedure.
//
//   node dist/rotate-keys.js [--dry-run]
//
// Run it with the same environment as the server, after every server node has
// been restarted with the new primary key. It is safe to run repeatedly and
// while the server is serving traffic.
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { machine } from '@crypt.fyi/core';
import { config } from './config.js';
import { rotateVaultKeys, countWebhookJobsOnPreviousKeys } from './vault/rotate.js';
import { WEBHOOK_QUEUE_NAME } from './webhook.js';

const JOB_PAGE_SIZE = 500;

const main = async () => {
  const dryRun = process.argv.includes('--dry-run');
  const keyring = machine.createKeyring(config.encryptionKey, config.encryptionPreviousKeys);
  const redis = new Redis(config.redisUrl, { family: 0 });

  try {
    const report = await rotateVaultKeys({ redis, keyring, dryRun });

    let webhookJobsOnPreviousKeys = 0;
    if (config.webhookSender === 'bullmq') {
      const queue = new Queue<string>(WEBHOOK_QUEUE_NAME, { connection: redis.options });
      try {
        // Paged per state so a large backlog never has to fit in memory at once.
        // Jobs moving between states mid-count can be missed or counted twice;
        // rerunning before removing a key covers that.
        for (const state of ['waiting', 'delayed', 'active', 'paused', 'prioritized'] as const) {
          for (let start = 0; ; start += JOB_PAGE_SIZE) {
            const jobs = await queue.getJobs([state], start, start + JOB_PAGE_SIZE - 1);
            webhookJobsOnPreviousKeys += await countWebhookJobsOnPreviousKeys(
              jobs.flatMap((job) => (typeof job?.data === 'string' ? [job.data] : [])),
              keyring,
            );
            if (jobs.length < JOB_PAGE_SIZE) {
              break;
            }
          }
        }
      } finally {
        await queue.close();
      }
    }

    const safeToRemovePreviousKeys =
      report.unreadable === 0 &&
      report.conflicts === 0 &&
      report.dependentOnPreviousKeys === 0 &&
      webhookJobsOnPreviousKeys === 0;

    // Only counts are printed, never keys, key ids or entry contents.
    console.log(
      JSON.stringify({ ...report, webhookJobsOnPreviousKeys, safeToRemovePreviousKeys }, null, 2),
    );
    if (report.unreadable > 0) {
      process.exitCode = 1;
    }
  } finally {
    await redis.quit();
  }
};

main().catch((error) => {
  console.error('key rotation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
