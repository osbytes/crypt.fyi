import { otlpShutdown } from './telemetry.js';
import { initApp } from './app.js';
import { Environment, config } from './config.js';
import { initLogging } from './logging.js';
import gracefulShutdown from 'http-graceful-shutdown';
import { Redis } from 'ioredis';
import { createRedisVault } from './vault/redis.js';
import { createTokenGenerator } from './vault/tokens.js';
import {
  createBullMQWebhookSender,
  createHTTPWebhookSender,
  type WebhookSender,
} from './webhook.js';
import { createFetchRetryClient } from '@crypt.fyi/core';

const main = async () => {
  const logger = await initLogging(config);
  const redis = new Redis(config.redisUrl, { family: 0 });
  await redis.ping();
  const tokenGenerator = createTokenGenerator({
    vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
    vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
  });
  let cleanupFns: (() => Promise<void>)[] = [];
  let webhookSender: WebhookSender;
  const webhookSenderFetch = createFetchRetryClient({
    maxAttempts: config.webhookMaxAttempts,
  });
  if (config.webhookSender === 'bullmq') {
    const bullmqRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null, family: 0 });
    const { webhookSender: bullmqWebhookSender, cleanup: cleanupWebhookSender } =
      createBullMQWebhookSender({
        logger,
        redis: bullmqRedis,
        encryptionKey: config.encryptionKey,
        requestTimeoutMs: config.webhookRequestTimeoutMs,
        maxAttempts: config.webhookMaxAttempts,
        backoffType: config.webhookBackoffType,
        backoffDelayMs: config.webhookBackoffDelayMs,
        removeOnComplete: config.webhookRemoveOnComplete,
        removeOnFail: config.webhookRemoveOnFail,
        concurrency: config.webhookConcurrency,
        drainDelayMs: config.webhookDrainDelayMs,
        streamEventsMaxLength: config.webhookStreamEventsMaxLength,
        fetchFn: webhookSenderFetch,
      });
    cleanupFns.push(cleanupWebhookSender, async () => {
      await bullmqRedis.quit();
    });
    webhookSender = bullmqWebhookSender;
  } else if (config.webhookSender === 'http') {
    const httpWebhookSender = createHTTPWebhookSender({
      logger,
      requestTimeoutMs: config.webhookRequestTimeoutMs,
      fetchFn: webhookSenderFetch,
    });
    webhookSender = httpWebhookSender;
  } else {
    throw new Error(`Invalid webhook sender: ${config.webhookSender}`);
  }

  const vault = createRedisVault(redis, tokenGenerator, webhookSender, config.encryptionKey);

  const app = await initApp(config, {
    logger,
    vault,
    redis,
  });

  app.fastify.listen(
    {
      host: '0.0.0.0',
      port: config.port,
    },
    (err, address) => {
      if (err) {
        logger.error(err);
        process.exit(1);
      }
      logger.info(`Server is running on ${address}`);
    },
  );
  gracefulShutdown(app.fastify.server, {
    timeout: config.shutdownTimeoutMs,
    development: config.env !== Environment.Prod,
    preShutdown: async (signal) => {
      logger.info({ signal }, 'Shutdown signal received');
    },
    onShutdown: async () => {
      await app.shutdown();
      await Promise.all(cleanupFns.map((fn) => fn()));
      await redis.quit();
      await otlpShutdown();
    },
    finally: () => {
      logger.info('Shutdown complete');
    },
  });
};

void main();
