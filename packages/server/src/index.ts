import { otlpShutdown } from './telemetry';
import { initApp } from './app';
import { Env, initConfig } from './config';
import { initLogging } from './logging';
import gracefulShutdown from 'http-graceful-shutdown';

const main = async () => {
    const config = await initConfig();
    const logger = await initLogging(config);
    const app = await initApp(config, logger);

    app.fastify.listen({
        port: config.port,
    });

    gracefulShutdown(app.fastify.server, {
        timeout: config.shutdownTimeoutMs,
        development: config.env !== Env.Prod,
        preShutdown: async (signal) => {
            logger.info({ signal }, 'Shutdown signal received');
        },
        onShutdown: async () => {
            await app.shutdown();
            await otlpShutdown();
        },
        finally: () => {
            logger.info('Shutdown complete');
        },
    });
};

main();
