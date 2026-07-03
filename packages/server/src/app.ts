import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyError } from 'fastify';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';
import { metrics } from '@opentelemetry/api';
import type { Config } from './config.js';
import type { Logger } from './logging.js';
import {
  createVaultResponseSchema,
  readVaultResponseSchema,
  ErrorInvalidKeyAndOrPassword,
  type Vault,
  createVaultRequestSchema,
  readVaultQuerySchema,
  readVaultParamsSchema,
  deleteVaultParamsSchema,
  deleteVaultRequestSchema,
} from '@crypt.fyi/core';
import { SsrfError } from '@crypt.fyi/core';
import { Redis } from 'ioredis';
import { assertWebhookUrlAllowed } from './ssrf.js';
import { BASE_OTEL_ATTRIBUTES } from './telemetry.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const favicon = readFileSync(join(__dirname, 'assets', 'favicon.ico'));

declare module 'fastify' {
  interface FastifyRequest {
    abortSignal: AbortSignal;
  }
}

declare module '@fastify/swagger' {
  interface FastifyDynamicSwaggerOptions {
    // https://github.com/fastify/fastify-swagger/issues/811
    exposeHeadRoutes?: boolean;
  }
}

export type AppDeps = {
  logger: Logger;
  vault: Vault;
  redis: Redis;
};

export const initApp = async (config: Config, deps: AppDeps) => {
  const { logger, vault, redis } = deps;

  const app = Fastify({
    loggerInstance: logger,
    trustProxy: true,
    bodyLimit: config.bodyLimit,
    genReqId: () => randomUUID(),
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: config.serviceName,
        description: config.serviceDescription,
        version: config.serviceVersion,
      },
      servers: [],
    },
    transform: jsonSchemaTransform,
    exposeHeadRoutes: true,
  });
  app.register(fastifySwaggerUI, {
    routePrefix: config.swaggerUIPath,
  });
  app.register(fastifyRateLimit, {
    redis: config.rateLimiter === 'redis' ? redis : undefined,
    nameSpace: config.rateLimitNameSpace,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

  app.register(helmet);
  app.register(compression);

  await app.after();

  const allowedOrigins = config.corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*');

  app.addHook('onRequest', async (req, res) => {
    // Access-Control-Allow-Origin must be a single origin or "*" — never a
    // comma-joined list. Reflect the request's Origin when it is allow-listed.
    if (allowAnyOrigin) {
      res.header('Access-Control-Allow-Origin', '*');
    } else {
      const requestOrigin = req.headers.origin;
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
      }
      // Response varies by Origin, so caches must key on it.
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', config.corsMethods);
    res.header('Access-Control-Allow-Headers', config.corsHeaders);

    if (req.method === 'OPTIONS') {
      return res.send('');
    }

    const ac = new AbortController();
    req.abortSignal = ac.signal;

    req.raw.on('close', () => {
      if (req.raw.destroyed) {
        ac.abort();
      }
    });
  });

  const meter = metrics.getMeter(config.serviceName);

  const redisEntriesGauge = meter.createObservableGauge('redis.entries', {
    description: 'Number of entries in Redis',
    unit: 'entries',
  });
  const memoryGauge = meter.createObservableGauge('system.memory.usage', {
    description: 'Process memory usage',
    unit: 'bytes',
  });
  const cpuGauge = meter.createObservableGauge('system.cpu.usage', {
    description: 'Process CPU usage',
    unit: 'percentage',
  });

  // Register metric callbacks once at init. Registering them inside a request
  // handler (e.g. /health) leaks a new callback per request and multiplies the
  // Redis dbsize() calls on every collection.
  redisEntriesGauge.addCallback(async (result) => {
    const count = await redis.dbsize();
    result.observe(count, BASE_OTEL_ATTRIBUTES);
  });
  memoryGauge.addCallback((result) => {
    const memoryUsage = process.memoryUsage();
    result.observe(memoryUsage.heapUsed, BASE_OTEL_ATTRIBUTES);
  });
  cpuGauge.addCallback((result) => {
    const cpuUsage = process.cpuUsage();
    const totalCPUTime = cpuUsage.user + cpuUsage.system;
    result.observe(totalCPUTime / 1000000, BASE_OTEL_ATTRIBUTES);
  });

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      hide: true,
    },
    handler: async (_, res) => {
      res.redirect(config.healthCheckEndpoint);
    },
  });

  app.route({
    method: 'GET',
    url: config.healthCheckEndpoint,
    exposeHeadRoute: false,
    schema: {
      description: 'Checks the health of the server and its dependencies.',
      tags: ['health'],
      summary: 'Health check',
    },
    handler: async (_, res) => {
      let redisOK = false;
      try {
        await redis.ping();
        redisOK = true;
      } catch (error) {
        logger.error(error);
      }

      res.status(redisOK ? 200 : 503).send({
        version: config.serviceVersion,
        name: config.serviceName,
        redis: redisOK,
      });
    },
  });

  app.get('/favicon.ico', { schema: { hide: true } }, (_, res) => {
    res.status(200).send(favicon);
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/vault',
    schema: {
      description:
        'Creates a new vault entry to store encrypted content with optional security features like burn after reading, IP restrictions, and webhooks.',
      tags: ['vault'],
      summary: 'Create new vault entry',
      body: createVaultRequestSchema
        .extend({
          ttl: z
            .number()
            .min(config.vaultEntryTTLMsMin)
            .max(config.vaultEntryTTLMsMax)
            .default(config.vaultEntryTTLMsDefault)
            .describe('time to live (TTL) in milliseconds'),
          rc: z.coerce
            .number()
            .min(2)
            .max(config.maxReadCount)
            .optional()
            .describe('maximum number of times the secret can be read'),
        })
        .superRefine((val, ctx) => {
          if (val.ips) {
            const ips = val.ips.split(',');

            if (ips.length > config.maxIpRestrictions) {
              ctx.addIssue({
                code: 'too_big',
                maximum: config.maxIpRestrictions,
                type: 'array',
                inclusive: true,
                message: `Too many IP restrictions (max ${config.maxIpRestrictions})`,
                origin: 'array',
              });
              return;
            }

            for (const ip of ips) {
              const trimmed = ip.trim();
              const isValidIP = z.union([z.ipv4(), z.ipv6()]).safeParse(trimmed).success;
              const isValidCIDR = z.union([z.cidrv4(), z.cidrv6()]).safeParse(trimmed).success;

              if (!isValidIP && !isValidCIDR) {
                ctx.addIssue({
                  code: 'custom',
                  message: `Invalid IP address or CIDR block: ${trimmed}`,
                });
                return;
              }
            }
          }

          if (val.c.length === 0) {
            ctx.addIssue({
              code: 'custom',
              path: ['c'],
              message: 'Content is required',
            });
          }
          if (val.b && val.rc !== undefined) {
            ctx.addIssue({
              code: 'custom',
              path: ['rc'],
              message: 'Read count cannot be used with burn after reading',
            });
          }
        }),
      response: {
        201: createVaultResponseSchema,
        400: z.object({ msg: z.string() }).describe('Invalid request'),
      },
    },
    async handler(req, res) {
      if (req.body.wh?.u) {
        try {
          await assertWebhookUrlAllowed(req.body.wh.u, {
            requireHttps: config.webhookRequireHttps,
          });
        } catch (error) {
          if (error instanceof SsrfError) {
            return res.status(400).send({ msg: error.message });
          }
          throw error;
        }
      }

      const result = await vault.set(req.body);

      res.status(201).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/vault/:vaultId',
    exposeHeadRoute: false,
    schema: {
      description:
        'Retrieves the content of a vault entry. If the entry is configured for burn after reading, it will be deleted after this request. IP restrictions and read count limits are enforced.',
      tags: ['vault'],
      summary: 'Retrieve vault entry',
      params: readVaultParamsSchema,
      querystring: readVaultQuerySchema,
      response: {
        200: readVaultResponseSchema,
        404: z.null().describe('Vault entry not found'),
        400: z.null().describe('Invalid key and/or password'),
      },
    },
    async handler(req, res) {
      try {
        const result = await vault.get(req.params.vaultId, req.query.h, req.ip);
        if (!result) {
          return res.status(404).send(null);
        }

        return res.send(result);
      } catch (error) {
        if (error instanceof ErrorInvalidKeyAndOrPassword) {
          return res.status(400).send(null);
        }

        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'HEAD',
    url: '/vault/:vaultId',
    schema: {
      description:
        'Checks if a vault entry exists. This is useful for checking if a vault entry has been deleted or not.',
      tags: ['vault'],
      summary: 'Check if vault entry exists',
      params: readVaultParamsSchema,
      response: {
        200: z.null(),
        404: z.null(),
      },
    },
    async handler(req, res) {
      const exists = await vault.exists(req.params.vaultId);
      if (!exists) {
        return res.status(404).send(null);
      }

      return res.status(200).send(null);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/vault/:vaultId',
    schema: {
      description:
        'Deletes a vault entry using the delete token that was provided when the entry was created.',
      tags: ['vault'],
      summary: 'Delete vault entry',
      params: deleteVaultParamsSchema,
      body: deleteVaultRequestSchema,
      response: {
        200: z.null().describe('Vault entry successfully deleted'),
        404: z.null().describe('Vault entry not found'),
      },
    },
    async handler(req, res) {
      const result = await vault.del(req.params.vaultId, req.body.dt);
      if (!result) {
        return res.status(404).send(null);
      }

      return res.status(200).send(null);
    },
  });

  app.setErrorHandler(function (error: FastifyError, req, res) {
    req.log.error(error);

    if (res.sent) return;

    res.status(error.statusCode ?? 500).send({ msg: error.message || 'Something went wrong' });
  });

  await app.ready();

  return {
    fastify: app,
    shutdown: async () => {
      // add any cleanup code here including database/redis disconnecting and background job shutdown
      await app.close();
      await new Promise<void>((resolve, reject) =>
        redis.quit((err) => (err ? reject(err) : resolve())),
      );
    },
  };
};
