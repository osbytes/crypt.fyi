import { otlpShutdown } from "./telemetry";
import { initApp } from "./app";
import { Environment, initConfig } from "./config";
import { initLogging } from "./logging";
import gracefulShutdown from "http-graceful-shutdown";
import Redis from "ioredis";
import { createRedisVault } from "./vault/redis";

const main = async () => {
  const config = await initConfig();
  const logger = await initLogging(config);
  const redis = new Redis();
  const vault = createRedisVault(redis, config, logger);

  const app = await initApp(config, {
    logger,
    vault,
    redis,
  });

  app.fastify.listen({
    port: config.port,
  });

  gracefulShutdown(app.fastify.server, {
    timeout: config.shutdownTimeoutMs,
    development: config.env !== Environment.Prod,
    preShutdown: async (signal) => {
      logger.info({ signal }, "Shutdown signal received");
    },
    onShutdown: async () => {
      await app.shutdown();
      await otlpShutdown();
    },
    finally: () => {
      logger.info("Shutdown complete");
    },
  });
};

main();
