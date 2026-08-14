import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyError, type FastifyReply } from 'fastify';
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
  createStreamRequestSchema,
  createStreamResponseSchema,
  uploadPartParamsSchema,
  uploadPartQuerySchema,
  completeStreamParamsSchema,
  completeStreamRequestSchema,
  generateRandomString,
  ErrorInvalidKeyAndOrPassword,
  type Vault,
  type VaultReadResult,
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
import { Readable } from 'node:stream';
import { buildObjectKey, MAX_PARTS, MIN_PART_SIZE, type BlobStorage } from './storage/index.js';
import { validatePart, type UploadStore } from './vault/uploads.js';
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
  /** Present only when streamed payloads are enabled. */
  blobStorage?: BlobStorage;
  uploadStore?: UploadStore;
};

export const initApp = async (config: Config, deps: AppDeps) => {
  const { logger, vault, redis, blobStorage, uploadStore } = deps;

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

      // The body is intentionally generic — it must not disclose the service
      // name, version, or dependency topology to unauthenticated callers.
      // Liveness is carried by the status code so probes still work.
      res.status(redisOK ? 200 : 503).send({
        status: redisOK ? 'ok' : 'error',
        kv: redisOK ? 'ok' : 'error',
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
        // Deliberately unconstrained: inline entries answer with JSON, streamed
        // entries answer with `application/octet-stream` carrying container
        // bytes. One schema cannot describe both, and serializing a multi-GB
        // stream through one would defeat the purpose.
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

        // This route answers with JSON or with raw container bytes, so no 200
        // response schema is declared and the typed reply cannot describe both.
        const reply = res as unknown as FastifyReply;

        if (result.blob) {
          return streamBlob(req.params.vaultId, result, reply);
        }

        return reply.send({
          c: result.c,
          b: result.b,
          ttl: result.ttl,
          cd: result.cd,
          m: result.m,
        });
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
      const { deleted, blob } = await vault.del(req.params.vaultId, req.body.dt);
      if (!deleted) {
        return res.status(404).send(null);
      }

      // An explicit delete always releases the bytes, even where the deployment
      // allows retention — retention means surviving a burn, not a delete.
      if (blob && blobStorage) {
        await blobStorage.delete(blob.k).catch((error) => {
          logger.error({ error, key: blob.k }, 'failed to delete stored object');
        });
      }

      return res.status(200).send(null);
    },
  });

  /**
   * Relays a blob-backed entry from storage. The client never learns the
   * storage endpoint, and nothing is buffered — memory stays proportional to
   * the socket rather than to the payload.
   */
  const streamBlob = async (vaultId: string, result: VaultReadResult, res: FastifyReply) => {
    const blob = result.blob;
    if (!blob) {
      return res.status(404).send(null);
    }
    if (!blobStorage) {
      logger.error({ id: vaultId }, 'entry references stored bytes but no storage is configured');
      return res.status(404).send(null);
    }

    const stored = await blobStorage.getStream({ key: blob.k });
    if (!stored) {
      logger.error({ id: vaultId, key: blob.k }, 'vault entry points at a missing object');
      return res.status(404).send(null);
    }

    // What the inline path returns as JSON fields travels in headers here, so
    // the body stays pure ciphertext.
    res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Length', String(stored.contentLength));
    res.header('X-Crypt-Burned', result.burned ? 'true' : 'false');
    res.header('X-Crypt-Created', String(result.cd));
    res.header('X-Crypt-Ttl', String(result.ttl));
    res.header('X-Crypt-Frames', String(blob.n));
    // Ciphertext is incompressible; compressing it spends CPU for nothing.
    res.header('Content-Encoding', 'identity');

    // The entry is already gone from Redis. Release the bytes only once the
    // transfer has landed, so a download that dies at 95% does not destroy a
    // payload that was never delivered.
    if (result.burned && !blob.r) {
      stored.body.once('end', () => {
        void blobStorage.delete(blob.k).catch((error) => {
          logger.error({ error, key: blob.k }, 'failed to delete burned object');
        });
      });
    }

    return res.send(stored.body);
  };

  if (blobStorage && uploadStore) {
    // A part is buffered while it is relayed — bounded by maxUploadPartBytes,
    // which is what keeps per-request memory O(part) rather than O(payload).
    // S3 UploadPart needs an exact ContentLength, which a raw stream cannot give
    // without trusting a client-supplied header.
    app.addContentTypeParser(
      'application/octet-stream',
      { parseAs: 'buffer', bodyLimit: config.maxUploadPartBytes },
      (_req, body, done) => done(null, body),
    );

    app.withTypeProvider<ZodTypeProvider>().route({
      method: 'POST',
      url: '/vault/stream',
      schema: {
        description:
          'Opens a streamed upload for a payload too large to send inline. Returns the vault id, its delete token, and an upload token used to send parts and complete the upload. The entry does not exist, and cannot be read, until completion.',
        tags: ['vault'],
        summary: 'Open a streamed upload',
        body: createStreamRequestSchema.extend({
          ttl: z
            .number()
            .min(config.vaultEntryTTLMsMin)
            .max(config.vaultEntryTTLMsMax)
            .default(config.vaultEntryTTLMsDefault)
            .describe('time to live (TTL) in milliseconds'),
          size: z
            .number()
            .int()
            .positive()
            .max(config.maxBlobBytes)
            .describe('total ciphertext byte length'),
        }),
        response: { 201: createStreamResponseSchema },
      },
      async handler(req, res) {
        if (req.body.wh) {
          await assertWebhookUrlAllowed(req.body.wh.u, {
            requireHttps: config.webhookRequireHttps,
          });
        }

        const [id, dt, ut, blobId] = await Promise.all([
          generateRandomString(config.vaultEntryIdentifierLength),
          generateRandomString(config.vaultEntryDeleteTokenLength),
          generateRandomString(config.uploadTokenLength),
          generateRandomString(config.blobIdLength),
        ]);

        const objectKey = buildObjectKey(config.blobKeyPrefix, blobId, new Date());
        const storageUploadId = await blobStorage.createUpload(objectKey);

        const { size, frames, ...vaultFields } = req.body;
        await uploadStore.create({
          id,
          uploadToken: ut,
          storageUploadId,
          objectKey,
          expectedBytes: size,
          frames,
          deleteToken: dt,
          vaultRecord: JSON.stringify(vaultFields),
          windowMs: config.uploadWindowMs,
        });

        return res
          .status(201)
          .send({ id, dt, ut, minPartSize: MIN_PART_SIZE, maxParts: MAX_PARTS });
      },
    });

    app.withTypeProvider<ZodTypeProvider>().route({
      method: 'PUT',
      url: '/vault/stream/:vaultId/parts/:partNumber',
      bodyLimit: config.maxUploadPartBytes,
      config: {
        // One request per part, so uploads must not share the vault API budget —
        // a single large payload would otherwise exhaust it immediately.
        rateLimit: { max: MAX_PARTS, timeWindow: config.uploadWindowMs },
      },
      schema: {
        description:
          'Uploads one part of a streamed payload. Parts may be any size the client chooses, provided every part except the one completing the payload is at least the advertised minimum.',
        tags: ['vault'],
        summary: 'Upload one part',
        params: uploadPartParamsSchema,
        querystring: uploadPartQuerySchema,
        response: {
          204: z.null(),
          404: z.null().describe('No open upload for this id and token'),
          409: z.null().describe('Part rejected'),
        },
      },
      async handler(req, res) {
        const pending = await uploadStore.authorize(req.params.vaultId, req.query.ut);
        if (!pending) {
          return res.status(404).send(null);
        }

        const body = req.body as Buffer;
        const parts = await uploadStore.listParts(req.params.vaultId);
        if (parts.some((part) => part.partNumber === req.params.partNumber)) {
          return res.status(409).send(null);
        }

        const validation = validatePart({
          partNumber: req.params.partNumber,
          contentLength: body.length,
          receivedBytes: parts.reduce((total, part) => total + part.size, 0),
          expectedBytes: pending.e,
        });
        if (!validation.ok) {
          logger.info(
            { id: req.params.vaultId, part: req.params.partNumber, reason: validation.reason },
            'rejected upload part',
          );
          return res.status(409).send(null);
        }

        const etag = await blobStorage.uploadPart({
          key: pending.k,
          uploadId: pending.s,
          partNumber: req.params.partNumber,
          body: Readable.from(body),
          contentLength: body.length,
        });

        await uploadStore.addPart(
          req.params.vaultId,
          { partNumber: req.params.partNumber, etag, size: body.length },
          config.uploadWindowMs,
        );

        return res.status(204).send(null);
      },
    });

    app.withTypeProvider<ZodTypeProvider>().route({
      method: 'POST',
      url: '/vault/stream/:vaultId/complete',
      schema: {
        description:
          'Finalises a streamed upload and publishes the vault entry. The entry becomes readable, and its TTL starts, only at this point.',
        tags: ['vault'],
        summary: 'Complete a streamed upload',
        params: completeStreamParamsSchema,
        body: completeStreamRequestSchema,
        response: {
          201: createVaultResponseSchema,
          404: z.null().describe('No open upload for this id and token'),
          409: z.null().describe('Uploaded bytes do not match the declared size'),
        },
      },
      async handler(req, res) {
        const pending = await uploadStore.authorize(req.params.vaultId, req.body.ut);
        if (!pending) {
          return res.status(404).send(null);
        }

        const parts = await uploadStore.listParts(req.params.vaultId);
        const receivedBytes = parts.reduce((total, part) => total + part.size, 0);
        if (parts.length === 0 || receivedBytes !== pending.e) {
          logger.info(
            { id: req.params.vaultId, receivedBytes, expected: pending.e },
            'refused to complete an upload with a size mismatch',
          );
          return res.status(409).send(null);
        }

        await blobStorage.completeUpload({
          key: pending.k,
          uploadId: pending.s,
          parts: parts.map(({ partNumber, etag }) => ({ partNumber, etag })),
        });

        const vaultFields = JSON.parse(pending.v) as Omit<
          z.infer<typeof createStreamRequestSchema>,
          'size' | 'frames'
        >;

        const result = await vault.set(
          {
            ...vaultFields,
            blob: { k: pending.k, s: receivedBytes, n: pending.n, r: config.allowPersistence },
          },
          { id: req.params.vaultId, dt: pending.dt },
        );

        await uploadStore.discard(req.params.vaultId);

        return res.status(201).send(result);
      },
    });
  }

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
