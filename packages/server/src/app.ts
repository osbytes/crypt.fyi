import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyRateLimit from '@fastify/rate-limit';
import { metrics } from '@opentelemetry/api';
import { Config } from './config';
import { Logger } from './logging';
import {
  createVaultResponseSchema,
  readVaultResponseSchema,
  ErrorInvalidKeyAndOrPassword,
  Vault,
  createVaultRequestSchema,
  readVaultQuerySchema,
  readVaultParamsSchema,
  deleteVaultParamsSchema,
  deleteVaultRequestSchema,
} from '@crypt.fyi/core';
import { Redis } from 'ioredis';
import { BASE_OTEL_ATTRIBUTES } from './telemetry';

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
    logger,
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

  app.addHook('onRequest', async (req, res) => {
    const origins = config.corsOrigin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (origins.length > 0 && !origins.includes('*')) {
      res.header('Access-Control-Allow-Origin', origins.join(','));
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', config.corsMethods);
    res.header('Access-Control-Allow-Headers', config.corsHeaders);

    if (req.method === 'OPTIONS') {
      return res.send();
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
  const memoryGauge = meter.createObservableCounter('system.memory.usage', {
    description: 'Process memory usage',
    unit: 'bytes',
  });
  const cpuGauge = meter.createObservableGauge('system.cpu.usage', {
    description: 'Process CPU usage',
    unit: 'percentage',
  });

  app.get(config.healthCheckEndpoint, async (_, res) => {
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

    const redisPing = await redis.ping();

    res.status(200).send({
      version: config.serviceVersion,
      name: config.serviceName,
      redis: !!redisPing,
    });
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/vault',
    schema: {
      body: createVaultRequestSchema
        .extend({
          ttl: z
            .number()
            .min(config.vaultEntryTTLMsMin)
            .max(config.vaultEntryTTLMsMax)
            .default(config.vaultEntryTTLMsDefault)
            .describe('time to live (TTL) in milliseconds'),
          rc: z
            .number({ coerce: true })
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
                code: z.ZodIssueCode.too_big,
                maximum: config.maxIpRestrictions,
                type: 'array',
                inclusive: true,
                message: `Too many IP restrictions (max ${config.maxIpRestrictions})`,
              });
              return false;
            }

            for (const ip of ips) {
              const trimmed = ip.trim();
              const isValidIP = z.string().ip().safeParse(trimmed).success;
              const isValidCIDR = z
                .string()
                .regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/)
                .safeParse(trimmed).success;

              if (!isValidIP && !isValidCIDR) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Invalid IP address or CIDR block: ${trimmed}`,
                });
                return false;
              }
            }
          }

          if (val.c.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['c'],
              message: 'Content is required',
            });
          }
          if (val.b && val.rc !== undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['rc'],
              message: 'Read count cannot be used with burn after reading',
            });
          }
        }),
      response: {
        201: createVaultResponseSchema,
      },
    },
    async handler(req, res) {
      const result = await vault.set(req.body);

      res.status(201).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/vault/:vaultId',
    schema: {
      params: readVaultParamsSchema,
      querystring: readVaultQuerySchema,
      response: {
        200: readVaultResponseSchema,
        404: z.null(),
        400: z.null(),
      },
    },
    async handler(req, res) {
      try {
        const result = await vault.get(req.params.vaultId, req.query.h, req.ip);
        if (!result) {
          return res.status(404).send();
        }

        return res.send(result);
      } catch (error) {
        if (error instanceof ErrorInvalidKeyAndOrPassword) {
          return res.status(400).send();
        }

        throw error;
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'HEAD',
    url: '/vault/:vaultId',
    schema: {
      params: readVaultParamsSchema,
      response: {
        200: z.null(),
        404: z.null(),
      },
    },
    async handler(req, res) {
      const exists = await vault.exists(req.params.vaultId);
      if (!exists) {
        return res.status(404).send();
      }

      return res.status(200).send();
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/vault/:vaultId',
    schema: {
      params: deleteVaultParamsSchema,
      body: deleteVaultRequestSchema,
      response: {
        200: z.null(),
        404: z.null(),
      },
    },
    async handler(req, res) {
      const result = await vault.del(req.params.vaultId, req.body.dt);
      if (!result) {
        return res.status(404).send();
      }

      return res.status(200).send();
    },
  });

  app.setErrorHandler(function (error, req, res) {
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
