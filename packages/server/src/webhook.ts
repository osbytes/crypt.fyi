import { Queue, Worker } from 'bullmq';
import { gcm } from '@crypt.fyi/core';
import { Logger } from './logging';
import Redis from 'ioredis';
import { z } from 'zod';

const webhookEventSchema = z.enum(['READ', 'BURN', 'FAILURE_KEY_PASSWORD', 'FAILURE_IP_ADDRESS']);

const messageSchema = z.object({
  url: z.string(),
  event: webhookEventSchema,
  id: z.string(),
  dt: z.string(),
  ts: z.number(),
  name: z.string().optional(),
});

export type Message = z.infer<typeof messageSchema>;

export interface WebhookSender {
  send(message: Message): Promise<void>;
}

export const createNopWebhookSender = (): WebhookSender => {
  return {
    send: async () => {},
  };
};

type BullMQWebhookSenderOptions = {
  logger: Logger;
  redis: Redis;
  encryptionKey: string;
  requestTimeoutMs: number;
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential';
  backoffDelayMs: number;
  removeOnComplete: boolean;
  removeOnFail: boolean;
  concurrency: number;
  drainDelayMs: number;
  streamEventsMaxLength: number;
  fetchFn?: typeof fetch;
};

export const createBullMQWebhookSender = ({
  logger,
  redis,
  encryptionKey,
  requestTimeoutMs,
  maxAttempts,
  backoffType,
  backoffDelayMs,
  removeOnComplete,
  removeOnFail,
  concurrency,
  drainDelayMs,
  streamEventsMaxLength,
  fetchFn = fetch,
}: BullMQWebhookSenderOptions): { webhookSender: WebhookSender; cleanup: () => Promise<void> } => {
  const QUEUE_NAME = 'webhooks';
  const JOB_NAME = 'webhook';
  const queue = new Queue<string>(QUEUE_NAME, {
    connection: redis,
    streams: {
      events: {
        maxLen: streamEventsMaxLength,
      },
    },
    defaultJobOptions: {
      attempts: maxAttempts,
      removeOnComplete,
      removeOnFail,
      backoff: {
        type: backoffType,
        delay: backoffDelayMs,
      },
    },
  });
  const worker = new Worker<string>(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== JOB_NAME) {
        logger.warn({ job: job.name }, 'skipping unexpected job');
        return;
      }

      const dataString = await gcm.decrypt(job.data, encryptionKey);
      const message = messageSchema.parse(JSON.parse(dataString));

      const ac = new AbortController();
      setTimeout(() => ac.abort(), requestTimeoutMs);
      try {
        const response = await fetchFn(message.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
          signal: ac.signal,
        });
        if (!response.ok) {
          throw new Error(`Unexpected status code: ${response.status}`);
        }

        logger.info({ jobId: job.id, event: message.event, id: message.id }, 'Webhook sent');
      } catch (error) {
        logger.info(
          {
            jobId: job.id,
            event: message.event,
            id: message.id,
            error,
          },
          'Failed to send webhook',
        );
        throw error;
      }
    },
    { connection: redis, concurrency, drainDelay: Math.round(drainDelayMs / 1000) },
  );

  worker.on('failed', async (job, error) => {
    if (job && job.attemptsMade >= maxAttempts) {
      const dataString = await gcm.decrypt(job.data, encryptionKey);
      const message = messageSchema.parse(JSON.parse(dataString));
      logger.info(
        {
          jobId: job.id,
          id: message.id,
          event: message.event,
          error,
          attempts: job.attemptsMade,
        },
        'Webhook failed permanently after all retry attempts',
      );
    }
  });

  return {
    webhookSender: {
      send: async (message) => {
        await queue.add(JOB_NAME, await gcm.encrypt(JSON.stringify(message), encryptionKey));
      },
    },
    cleanup: async () => {
      await Promise.all([queue.close(), worker.close()]);
    },
  };
};
