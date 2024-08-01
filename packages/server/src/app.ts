import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import pino from 'pino';
import helmet from '@fastify/helmet';
import compression from '@fastify/compress';
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    ZodTypeProvider,
} from 'fastify-type-provider-zod';
import z from 'zod';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import Redis from 'ioredis';

import { Config } from './config';
import { createRedisVault } from './vault/redis';

declare module 'fastify' {
    interface FastifyRequest {
        abortSignal: AbortSignal;
    }
}

export const initApp = async (config: Config, logger: pino.Logger) => {
    const redis = new Redis();
    const vault = createRedisVault(redis);

    const app = Fastify({
        logger,
        trustProxy: true,
        bodyLimit: 1024,
        genReqId: () => randomUUID(),
    });
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    app.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'phemvault-server',
                description: 'phemvault-server',
                version: '1.0.0',
            },
            servers: [],
        },
        transform: jsonSchemaTransform,
    });
    app.register(fastifySwaggerUI, {
        routePrefix: '/docs',
    });

    app.register(helmet);
    app.register(compression);

    await app.after();

    app.addHook('onRequest', async (req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "*");
        res.header("Access-Control-Allow-Headers", "*");

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

    app.get(config.healthCheckEndpoint, (req, res) => {
        // TODO: throttled otel gauges for redis entries, cpu, memory, etc.

        res.status(200).send();
    });

    // TODO: rate limit endpoints
    app.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/vault',
        schema: {
            body: z.object({
                c: z.string().describe("encrypted content"),
                b: z.boolean().default(true).describe("burn after reading"),
                p: z.boolean().default(false).describe("password was set"),
                ttl: z.number().max(1000 * 60 * 60).default(1000 * 60 * 5).describe("time to live (TTL) in milliseconds"),
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
        method: 'GET',
        url: '/vault/:vaultId',
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
        method: 'DELETE',
        url: '/vault/:vaultId',
        schema: {
            params: z.object({
                vaultId: z.string(),
            }),
            querystring: z.object({
                dt: z.string().describe("delete token")
            }),
            response: {
                200: z.null(),
                404: z.null(),
            },
        },
        async handler(req, res) {
            const result = await vault.del(req.params.vaultId, req.query.dt);
            if (!result) {
                return res.status(404).send();
            }

            return res.status(200).send();
        },
    });

    app.setErrorHandler(function (error, req, res) {
        req.log.error(error);

        if (res.sent) return;

        res.status(500).send({ msg: 'Something went wrong' });
    });

    await app.ready();

    return {
        fastify: app,
        shutdown: async () => {
            // add any cleanup code here including database/redis disconnecting and background job shutdown
            await app.close();
        },
    };
};
