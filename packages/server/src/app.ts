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

  app.route({
    method: 'GET',
    url: config.healthCheckEndpoint,
    exposeHeadRoute: false,
    handler: async (_, res) => {
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
    },
  });

  const faviconBase64 =
    'AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAAMMOAADDDgAAAAAAAAAAAAAAAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/xcXF/84ODj/SEhI/z8/P/8gICD/BQUF/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8EBAT/QUFB/1ZWVv8zMzP/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/x4eHv+Dg4P/09PT//Ly8v/5+fn/9fX1/+Dg4P+goKD/NDQ0/wEBAf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/w0NDf/FxcX//////5qamv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP86Ojr/y8vL///////////////////////////////////////j4+P/Xl5e/wICAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wMDA/81NTX/SEhI/ywsLP8AAAD/DQ0N/8fHx///////nJyc/wAAAP8AAAD/AAAA/wAAAP8AAAD/Kioq/9PT0/////////////7+/v/v7+//4ODg/+zs7P/+/v7////////////r6+v/TU1N/wAAAP8AAAD/AAAA/wAAAP8AAAD/CgoK/729vf//////nZ2d/wAAAP8NDQ3/x8fH//////+cnJz/AAAA/wAAAP8AAAD/AAAA/wUFBf+enp7////////////z8/P/lJSU/zc3N/8eHh7/MDAw/4GBgf/r6+v////////////Ozs7/V1dX/05OTv9PT0//T09P/09PT/9WVlb/1dXV//////+/v7//T09P/1hYWP/Y2Nj//////5ycnP8AAAD/AAAA/wAAAP8AAAD/MjIy/+rq6v//////+/v7/3l5ef8EBAT/AAAA/wAAAP8AAAD/AQEB/15eXv/z8/P////////////8/Pz/+/v7//v7+//7+/v/+/v7//v7+//+/v7///////7+/v/7+/v/+/v7//7+/v//////nJyc/wAAAP8AAAD/AAAA/wAAAP9paWn////////////Kysr/FBQU/wAAAP8AAAD/AAAA/wAAAP8AAAD/CAgI/6urq//5+fn/9fX1//X19f/19fX/9fX1//X19f/19fX//f39//////////////////r6+v/09PT/8/Pz//b29v+UlJT/AAAA/wAAAP8AAAD/AAAA/4qKiv///////////5eXl/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/ISEh/z4+Pv89PT3/PT09/z09Pf89PT3/Ozs7/2VlZf/v7+//////////////////19fX/1BQUP9dXV3/aWlp/z8/P/8AAAD/AAAA/wAAAP8AAAD/jY2N////////////l5eX/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/RUVF/+Hh4f/v7+//tra2//r6+v/Gxsb/Li4u/7W1tf/y8vL/j4+P/wAAAP8AAAD/AAAA/wAAAP9wcHD////////////Kysr/FBQU/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8CAgL/MDAw/2BgYP8jIyP/a2tr/x4eHv8ICAj/gICA/6mpqf9kZGT/AAAA/wAAAP8AAAD/AAAA/zk5Of/v7+////////v7+/97e3v/BQUF/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8BAQH/AQEB/wEBAf8AAAD/AAAA/wAAAP8AAAD/CAgI/6mpqf////////////Pz8/+VlZX/Ozs7/yEhIf82Njb/SkpK/wkJCf8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/MzMz/9ra2v/////////////////y8vL/4+Pj/+/v7//19fX/iYmJ/w8PD/8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/Q0ND/9TU1P/////////////////////////////////7+/v/f39//wICAv8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/JSUl/4qKiv/U1NT/8vLy//j4+P/w8PD/0tLS/4mJif8lJSX/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AgIC/xcXF/84ODj/RUVF/zU1Nf8WFhb/AgIC/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const faviconIco = Buffer.from(faviconBase64, 'base64');

  app.get('/favicon.ico', { schema: { hide: true } }, (_, res) => {
    res.status(200).send(faviconIco);
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
    exposeHeadRoute: false,
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
        const result = await vault.get(req.params.vaultId, req.query.h, req.query.h2 ?? '', req.ip);
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
