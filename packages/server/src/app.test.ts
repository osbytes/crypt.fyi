import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp } from './app.js';
import { config as baseConfig } from './config.js';
import type { Config } from './config.js';
import type { AddressInfo } from 'node:net';
import { pino } from 'pino';
import { createRedisVault } from './vault/redis.js';
import { createTokenGenerator } from './vault/tokens.js';
import { createNopWebhookSender } from './webhook.js';
import { Redis } from 'ioredis';
import { Client } from 'undici';
import { gcm } from '@crypt.fyi/core';

const initAppTest = async () => {
  const config = {
    ...baseConfig,
    healthCheckEndpoint: '/some-health-check-endpoint',
    vaultEntryTTLMsDefault: 1000,
    rateLimitMax: Number.MAX_SAFE_INTEGER,
  } satisfies Config;
  const logger = pino({ enabled: false });
  const tokenGenerator = createTokenGenerator({
    vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
    vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
  });
  const redis = new Redis();
  const vault = createRedisVault(redis, tokenGenerator, createNopWebhookSender(), 'foobar');
  const app = await initApp(config, {
    logger,
    vault,
    redis,
  });
  await app.fastify.listen();
  const baseUrl = `http://localhost:${(app.fastify.server.address() as AddressInfo).port}`;
  const client = new Client(baseUrl);

  return {
    config,
    app,
    client,
    redis,
  };
};

describe('app', () => {
  let testContext: Awaited<ReturnType<typeof initAppTest>>;

  beforeEach(async () => {
    testContext = await initAppTest();
  });

  afterEach(async () => {
    // Close in correct order to avoid connection issues
    await testContext.app.shutdown();
    await testContext.app.fastify.close();
    await testContext.client.close();
  });

  it('should return 200 for config health check endpoint', async () => {
    const response = await testContext.client.request({
      method: 'GET',
      path: testContext.config.healthCheckEndpoint,
    });

    expect(response.statusCode).toBe(200);
  });

  it('retrieves and burns vault entry', async () => {
    const createResponse = await testContext.client.request({
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

    expect(createResponse.statusCode).toBe(201);
    const { id, dt } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');
    expect(typeof dt).toBe('string');

    const getResponse1 = await testContext.client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    expect(getResponse1.statusCode).toBe(200);
    const { c, b } = (await getResponse1.body.json()) as Record<string, unknown>;
    expect(c).toBe('foobar');
    expect(b).toBe(true);

    const getResponse2 = await testContext.client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    expect(getResponse2.statusCode).toBe(404);
  });

  it('only one client receives burned vault entry during concurrent requests', async () => {
    const createResponse = await testContext.client.request({
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

    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const numClients = 5;
    const clients = Array.from(
      { length: numClients },
      () =>
        new Client(
          `http://localhost:${(testContext.app.fastify.server.address() as AddressInfo).port}`,
        ),
    );

    try {
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
      expect(successfulResponses.length).toBe(1);

      const successfulResponse = successfulResponses[0];
      expect(successfulResponse.body?.c).toBe('secret-content');
      expect(successfulResponse.body?.b).toBe(true);

      const failedResponses = responses.filter((r) => r.status !== 200);
      expect(failedResponses.length).toBe(numClients - 1);
      failedResponses.forEach((response) => {
        expect(response.status).toBe(404);
      });

      const verifyResponse = await testContext.client.request({
        method: 'GET',
        path: `/vault/${id}?h=abc123`,
      });
      expect(verifyResponse.statusCode).toBe(404);
    } finally {
      await Promise.all(clients.map((c) => c.close()));
    }
  });

  it('only "read count" number of clients receive vault entry during concurrent requests', async () => {
    const readCount = 3;
    const createResponse = await testContext.client.request({
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

    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const numClients = 5;
    const clients = Array.from(
      { length: numClients },
      () =>
        new Client(
          `http://localhost:${(testContext.app.fastify.server.address() as AddressInfo).port}`,
        ),
    );

    try {
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
      expect(successfulResponses.length).toBe(readCount);

      successfulResponses.forEach((response) => {
        expect(response.body?.c).toBe('secret-content');
        expect(response.body?.b).toBe(false);
      });

      const failedResponses = responses.filter((r) => r.status !== 200);
      expect(failedResponses.length).toBe(numClients - readCount);
      failedResponses.forEach((response) => {
        expect(response.status).toBe(404);
      });

      const verifyResponse = await testContext.client.request({
        method: 'GET',
        path: `/vault/${id}?h=abc123`,
      });
      expect(verifyResponse.statusCode).toBe(404);
    } finally {
      await Promise.all(clients.map((c) => c.close()));
    }
  });

  it('verifies TTL behavior with read count', async () => {
    const initialTTL = 5000;
    const readCount = 3;
    const createResponse = await testContext.client.request({
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

    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const initialRedisTTL = await testContext.redis.pttl(`vault:${id}`);
    expect(initialRedisTTL).toBeGreaterThan(4975);
    expect(initialRedisTTL).toBeLessThanOrEqual(5000);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const getResponse = await testContext.client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    expect(getResponse.statusCode).toBe(200);

    const ttlAfterRead = await testContext.redis.pttl(`vault:${id}`);
    expect(ttlAfterRead).toBeGreaterThanOrEqual(3950);
    expect(ttlAfterRead).toBeLessThanOrEqual(4000);

    const remainingReads = JSON.parse((await testContext.redis.get(`vault:${id}`)) ?? '{}')?.rc;
    expect(remainingReads).toBe(2);
  });

  it('verifies IPs and webhook URLs are encrypted at rest', async () => {
    const createResponse = await testContext.client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'secret-content',
        b: false,
        h: 'abc123',
        ips: '192.168.1.1,10.0.0.0/24',
        wh: {
          u: 'https://example.com/webhook',
          n: 'test-webhook',
          r: true,
          b: true,
          fpk: true,
          fip: true,
        },
      }),
    });

    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const redis = new Redis();
    afterEach(async () => {
      await redis.quit();
    });

    const rawValue = await redis.get(`vault:${id}`);
    expect(rawValue).toBeTruthy();

    const parsedValue = JSON.parse(rawValue!) as {
      ips: string;
      wh: { u: string; n: string };
    };

    // Verify IPs are encrypted
    expect(parsedValue.ips).not.toBe('192.168.1.1,10.0.0.0/24');
    expect(parsedValue.ips.length).toBeGreaterThan(0);

    // Verify webhook URL is encrypted
    expect(parsedValue.wh.u).not.toBe('https://example.com/webhook');
    expect(parsedValue.wh.u.length).toBeGreaterThan(0);

    const [decryptedIps, decryptedWhU] = await Promise.all([
      gcm.decrypt(parsedValue.ips, testContext.config.encryptionKey),
      gcm.decrypt(parsedValue.wh.u, testContext.config.encryptionKey),
    ]);

    expect(decryptedIps).toBe('192.168.1.1,10.0.0.0/24');
    expect(decryptedWhU).toBe('https://example.com/webhook');
  });

  it('deletes vault entry', async () => {
    const createResponse = await testContext.client.request({
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

    const deleteResponse = await testContext.client.request({
      method: 'DELETE',
      path: `/vault/${id}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dt,
      }),
    });
    expect(deleteResponse.statusCode).toBe(200);

    const getResponse = await testContext.client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    expect(getResponse.statusCode).toBe(404);
  });
  it('respects the failure count', async () => {
    const createResponse = await testContext.client.request({
      method: 'POST',
      path: '/vault',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        c: 'foobar',
        b: true,
        h: 'abc123',
        fc: 5,
      }),
    });
    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const numClients = 5;
    const clients = Array.from(
      { length: numClients },
      () =>
        new Client(
          `http://localhost:${(testContext.app.fastify.server.address() as AddressInfo).port}`,
        ),
    );

    try {
      const responses = await Promise.all(
        clients.map((client) =>
          client.request({
            method: 'GET',
            path: `/vault/${id}?h=xyz789`,
          }),
        ),
      );

      const successfulResponses = responses.filter((r) => r.statusCode === 400);
      expect(successfulResponses.length).toBe(numClients);

      const verifyResponse = await testContext.client.request({
        method: 'GET',
        path: `/vault/${id}?h=abc123`,
      });
      expect(verifyResponse.statusCode).toBe(404);
    } finally {
      await Promise.all(clients.map((c) => c.close()));
    }
  });
});
