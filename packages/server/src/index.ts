import { otlpShutdown } from './telemetry';
import { initApp } from './app';
import { Environment, config } from './config';
import { initLogging } from './logging';
import gracefulShutdown from 'http-graceful-shutdown';
import Redis from 'ioredis';
import { createRedisVault } from './vault/redis';
import { createTokenGenerator } from './vault/tokens';
import { createBullMQWebhookSender, createHTTPWebhookSender, WebhookSender } from './webhook';

const main = async () => {
  const logger = await initLogging(config);
  const redis = new Redis(config.redisUrl);
  await redis.ping();
  const tokenGenerator = createTokenGenerator({
    vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
    vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
  });
  let cleanupFns: (() => Promise<void>)[] = [];
  let webhookSender: WebhookSender;
  if (config.webhookSender === 'bullmq') {
    const bullmqRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
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
      });
    cleanupFns.push(cleanupWebhookSender, async () => {
      await bullmqRedis.quit();
    });
    webhookSender = bullmqWebhookSender;
  } else if (config.webhookSender === 'http') {
    const httpWebhookSender = createHTTPWebhookSender({
      logger,
      requestTimeoutMs: config.webhookRequestTimeoutMs,
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

  app.fastify.listen({
    host: '0.0.0.0',
    port: config.port,
  });

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

main();
