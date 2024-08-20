import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import compression from "@fastify/compress";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import z from "zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import fastifyRateLimit from "@fastify/rate-limit";

import { Config } from "./config";
import { Logger } from "./logging";
import { Vault } from "./vault/vault";
import { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyRequest {
    abortSignal: AbortSignal;
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
        title: "phemvault-server",
        description: "phemvault-server",
        version: "1.0.0",
      },
      servers: [],
    },
    transform: jsonSchemaTransform,
  });
  app.register(fastifySwaggerUI, {
    routePrefix: config.swaggerUIPath,
  });
  app.register(fastifyRateLimit, {
    redis,
    nameSpace: config.rateLimitNameSpace,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

  app.register(helmet);
  app.register(compression);

  await app.after();

  app.addHook("onRequest", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
      return res.send();
    }

    const ac = new AbortController();
    req.abortSignal = ac.signal;

    req.raw.on("close", () => {
      if (req.raw.destroyed) {
        ac.abort();
      }
    });
  });

  app.get(config.healthCheckEndpoint, (req, res) => {
    // TODO: throttled otel gauges for redis entries, cpu, memory, etc.

    res.status(200).send();
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/vault",
    schema: {
      body: z.object({
        c: z.string().describe("encrypted content"),
        b: z.boolean().default(true).describe("burn after reading"),
        p: z.boolean().default(false).describe("password was set"),
        ttl: z
          .number()
          .min(config.vaultEntryTTLMsMin)
          .max(config.vaultEntryTTLMsMax)
          .default(config.vaultEntryTTLMsDefault)
          .describe("time to live (TTL) in milliseconds"),
      }),
      response: {
        201: z.object({
          id: z.string(),
          dt: z.string(),
        }),
      },
    },
    async handler(req, res) {
      const result = await vault.set(req.body);

      res.status(201).send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/vault/:vaultId",
    schema: {
      params: z.object({
        vaultId: z.string(),
      }),
      response: {
        200: z.object({
          c: z.string(),
          b: z.boolean(),
          p: z.boolean(),
        }),
        404: z.null(),
      },
    },
    async handler(req, res) {
      const result = await vault.get(req.params.vaultId);
      if (!result) {
        return res.status(404).send();
      }

      return res.send(result);
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/vault/:vaultId",
    schema: {
      params: z.object({
        vaultId: z.string(),
      }),
      body: z.object({
        dt: z.string(),
      }),
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

    res
      .status(error.statusCode ?? 500)
      .send({ msg: error.message || "Something went wrong" });
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
