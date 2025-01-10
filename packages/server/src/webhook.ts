import { Queue, Worker } from 'bullmq';
import { Logger } from './logging';
import Redis from 'ioredis';

export type WebhookEvent = 'READ' | 'BURN' | 'FAILURE_KEY_PASSWORD' | 'FAILURE_IP_ADDRESS';

export type Message = {
  url: string;
  event: WebhookEvent;
  id: string;
  dt: string;
  ts: number;
  name?: string;
};

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
  fetchFn?: typeof fetch;
  requestTimeoutMs?: number;
  maxAttempts?: number;
  backoffType?: 'fixed' | 'exponential';
  backoffDelayMs?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  concurrency?: number;
  drainDelayMs?: number;
};

export const createBullMQWebhookSender = ({
  logger,
  redis,
  fetchFn = fetch,
  requestTimeoutMs = 3000,
  maxAttempts = 5,
  backoffType = 'exponential',
  backoffDelayMs = 1000,
  removeOnComplete = true,
  removeOnFail = true,
  concurrency = 50,
  drainDelayMs = 15_000,
}: BullMQWebhookSenderOptions): { webhookSender: WebhookSender; cleanup: () => Promise<void> } => {
  const QUEUE_NAME = 'webhooks';
  const JOB_NAME = 'webhook';
  const queue = new Queue<Message>(QUEUE_NAME, {
    connection: redis,
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
  const worker = new Worker<Message>(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== JOB_NAME) {
        logger.warn({ job: job.name }, 'skipping unexpected job');
        return;
      }

      const { data: message } = job;

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

  worker.on('failed', (job, error) => {
    if (job && job.attemptsMade >= maxAttempts) {
      logger.info(
        {
          jobId: job.id,
          id: job.data.id,
          event: job.data.event,
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
        await queue.add(JOB_NAME, message);
      },
    },
    cleanup: async () => {
      await Promise.all([queue.close(), worker.close()]);
    },
  };
};
