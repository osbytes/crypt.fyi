import pino from 'pino';
import { initApp } from './app';
import { config as baseConfig, Config } from './config';

import tap, { Test } from 'tap';
import { Client } from 'undici';
import { AddressInfo } from 'node:net';
import Redis from 'ioredis';
import { createRedisVault } from './vault/redis';
import { createTokenGenerator } from './vault/tokens';
import { createNopWebhookSender } from './webhook';

const initAppTest = async (t: Test) => {
  const config = {
    ...baseConfig,
    healthCheckEndpoint: '/some-health-check-endpoint',
    vaultEntryTTLMsDefault: 1000,
    rateLimitMax: 100,
  } satisfies Config;
  const logger = pino({ enabled: false });
  const redis = new Redis();
  const tokenGenerator = createTokenGenerator({
    vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
    vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
  });
  const vault = createRedisVault(redis, tokenGenerator, createNopWebhookSender(), 'foobar');
  const app = await initApp(config, {
    logger,
    vault,
    redis,
  });
  await app.fastify.listen();
  const baseUrl = `http://localhost:${(app.fastify.server.address() as AddressInfo).port}`;
  const client = new Client(baseUrl);

  t.teardown(() => {
    app.shutdown();
    app.fastify.close();
    client.close();
  });

  return {
    config,
    app,
    client,
  };
};

tap.test('app', async (t) => {
  const { config, client } = await initAppTest(t);

  t.test('should return 200 for config health check endpoint', async (t) => {
    const response = await client.request({
      method: 'GET',
      path: config.healthCheckEndpoint,
    });

    t.equal(response.statusCode, 200);
  });

  t.test('retrieves and burns vault entry', async (t) => {
    const createResponse = await client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'foobar',
        b: true,
        h: 'abc123',
      }),
    });

    t.equal(createResponse.statusCode, 201);
    const { id, dt } = (await createResponse.body.json()) as Record<string, unknown>;
    t.equal(typeof id, 'string');
    t.equal(typeof dt, 'string');

    const getResponse1 = await client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    t.equal(getResponse1.statusCode, 200);
    const { c, b } = (await getResponse1.body.json()) as Record<string, unknown>;
    t.equal(c, 'foobar');
    t.equal(b, true);

    const getResponse2 = await client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    t.equal(getResponse2.statusCode, 404);
  });

  t.test('only one client receives burned vault entry during concurrent requests', async (t) => {
    const createResponse = await client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'secret-content',
        b: true,
        ttl: 5000,
        h: 'abc123',
      }),
    });

    t.equal(createResponse.statusCode, 201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    t.equal(typeof id, 'string');

    const config = {
      ...baseConfig,
      healthCheckEndpoint: '/some-health-check-endpoint',
      vaultEntryTTLMsDefault: 1000,
      rateLimitMax: 100,
    } satisfies Config;
    const logger = pino({ enabled: false });
    const redis = new Redis();
    const tokenGenerator = createTokenGenerator({
      vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
      vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
    });
    const vault = createRedisVault(redis, tokenGenerator, createNopWebhookSender(), 'foobar');
    const app = await initApp(config, {
      logger,
      vault,
      redis,
    });
    await app.fastify.listen();
    const baseUrl = `http://localhost:${(app.fastify.server.address() as AddressInfo).port}`;
    const numClients = 5;
    const clients = Array.from({ length: numClients }, () => new Client(baseUrl));
    t.teardown(() => {
      app.shutdown();
      app.fastify.close();
      clients.forEach((c) => c.close());
    });

    const responses = await Promise.all(
      clients.map((client) =>
        client
          .request({
            method: 'GET',
            path: `/vault/${id}?h=abc123`,
          })
          .then(async (response) => ({
            status: response.statusCode,
            body:
              response.statusCode === 200
                ? ((await response.body.json()) as Record<string, unknown>)
                : null,
          })),
      ),
    );

    const successfulResponses = responses.filter((r) => r.status === 200);
    t.equal(successfulResponses.length, 1, 'Only one request should succeed');

    const successfulResponse = successfulResponses[0];
    t.equal(
      successfulResponse.body?.c,
      'secret-content',
      'Successful response should have correct content',
    );
    t.equal(successfulResponse.body?.b, true, 'Successful response should indicate burn status');

    const failedResponses = responses.filter((r) => r.status !== 200);
    t.equal(failedResponses.length, numClients - 1, 'All other requests should fail');
    failedResponses.forEach((response) => {
      t.equal(response.status, 404, 'Failed requests should return 404');
    });

    const verifyResponse = await client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    t.equal(verifyResponse.statusCode, 404, 'Subsequent request should fail');
  });

  t.test(
    'only "read count" number of clients receive vault entry during concurrent requests',
    async (t) => {
      const readCount = 3;
      const createResponse = await client.request({
        method: 'POST',
        path: '/vault',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          c: 'secret-content',
          ttl: 5000,
          h: 'abc123',
          b: false,
          rc: readCount,
        }),
      });

      t.equal(createResponse.statusCode, 201);
      const { id } = (await createResponse.body.json()) as Record<string, unknown>;
      t.equal(typeof id, 'string');

      const config = {
        ...baseConfig,
        healthCheckEndpoint: '/some-health-check-endpoint',
        vaultEntryTTLMsDefault: 1000,
        rateLimitMax: 100,
      } satisfies Config;
      const logger = pino({ enabled: false });
      const redis = new Redis();
      const tokenGenerator = createTokenGenerator({
        vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
        vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
      });
      const vault = createRedisVault(redis, tokenGenerator, createNopWebhookSender(), 'foobar');
      const app = await initApp(config, {
        logger,
        vault,
        redis,
      });
      await app.fastify.listen();
      const baseUrl = `http://localhost:${(app.fastify.server.address() as AddressInfo).port}`;
      const numClients = 5;
      const clients = Array.from({ length: numClients }, () => new Client(baseUrl));
      t.teardown(() => {
        app.shutdown();
        app.fastify.close();
        clients.forEach((c) => c.close());
      });

      const responses = await Promise.all(
        clients.map((client) =>
          client
            .request({
              method: 'GET',
              path: `/vault/${id}?h=abc123`,
            })
            .then(async (response) => ({
              status: response.statusCode,
              body:
                response.statusCode === 200
                  ? ((await response.body.json()) as Record<string, unknown>)
                  : null,
            })),
        ),
      );

      const successfulResponses = responses.filter((r) => r.status === 200);
      t.equal(successfulResponses.length, readCount, `Only ${readCount} request should succeed`);

      successfulResponses.forEach((response) => {
        t.equal(
          response.body?.c,
          'secret-content',
          'Successful response should have correct content',
        );
        t.equal(response.body?.b, false, 'Successful response should not indicate burn status');
      });

      const failedResponses = responses.filter((r) => r.status !== 200);
      t.equal(failedResponses.length, numClients - readCount, 'All other requests should fail');
      failedResponses.forEach((response) => {
        t.equal(response.status, 404, 'Failed requests should return 404');
      });

      const verifyResponse = await client.request({
        method: 'GET',
        path: `/vault/${id}?h=abc123`,
      });
      t.equal(verifyResponse.statusCode, 404, 'Subsequent request should fail');
    },
  );

  t.test('verifies TTL behavior with read count', async (t) => {
    const initialTTL = 5000;
    const readCount = 3;
    const createResponse = await client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'secret-content',
        ttl: initialTTL,
        h: 'abc123',
        b: false,
        rc: readCount,
      }),
    });

    t.equal(createResponse.statusCode, 201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    t.equal(typeof id, 'string');

    const redis = new Redis();
    t.teardown(() => redis.quit());
    const initialRedisTTL = await redis.pttl(`vault:${id}`);
    t.ok(initialRedisTTL > 4990 && initialRedisTTL <= 5000, 'Initial TTL should be set');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const getResponse = await client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    t.equal(getResponse.statusCode, 200);

    const ttlAfterRead = await redis.pttl(`vault:${id}`);
    t.ok(ttlAfterRead >= 3950 && ttlAfterRead <= 4000, 'TTL should be maintained');

    const remainingReads = JSON.parse((await redis.get(`vault:${id}`)) ?? '{}')?.rc;
    t.equal(remainingReads, 2, 'Read count should be decremented');
  });

  t.test('deletes vault entry', async (t) => {
    const createResponse = await client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'foobar',
        b: true,
        h: 'abc123',
      }),
    });
    const { id, dt } = (await createResponse.body.json()) as Record<string, unknown>;

    const deleteResponse = await client.request({
      method: 'DELETE',
      path: `/vault/${id}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dt,
      }),
    });
    t.equal(deleteResponse.statusCode, 200);

    const getResponse = await client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    t.equal(getResponse.statusCode, 404);
  });
});
