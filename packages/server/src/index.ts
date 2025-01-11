import { otlpShutdown } from './telemetry';
import { initApp } from './app';
import { Environment, config } from './config';
import { initLogging } from './logging';
import gracefulShutdown from 'http-graceful-shutdown';
import Redis from 'ioredis';
import { createRedisVault } from './vault/redis';
import { createTokenGenerator } from './vault/tokens';
import { createBullMQWebhookSender } from './webhook';

const main = async () => {
  const logger = await initLogging(config);
  const redis = new Redis(config.redisUrl);
  await redis.ping();
  const bullmqRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  const tokenGenerator = createTokenGenerator({
    vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
    vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
  });
  const { webhookSender, cleanup: cleanupWebhookSender } = createBullMQWebhookSender({
    logger,
    redis: bullmqRedis,
    encryptionKey: config.encryptionKey,
  });
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
      await cleanupWebhookSender();
      await bullmqRedis.quit();
      await redis.quit();
      await otlpShutdown();
    },
    finally: () => {
      logger.info('Shutdown complete');
    },
  });
};

main();
