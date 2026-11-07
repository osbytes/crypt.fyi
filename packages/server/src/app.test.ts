import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp } from './app.js';
import { config as baseConfig } from './config.js';
import type { Config } from './config.js';
import type { AddressInfo } from 'node:net';
import { pino } from 'pino';
import { createRedisVault } from './vault/redis.js';
import { createTokenGenerator } from './vault/tokens.js';
import { createNopWebhookSender, type Message } from './webhook.js';
import { Redis } from 'ioredis';
import { Client } from 'undici';
import { machine, type CreateVaultRequest } from '@crypt.fyi/core';

const initAppTest = async () => {
  const config = {
    ...baseConfig,
    healthCheckEndpoint: '/some-health-check-endpoint',
    vaultEntryTTLMsDefault: 1000,
    // Keep counters out of Redis so unit tests cannot poison e2e / local API limits.
    rateLimiter: 'memory',
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

  it('serves the swagger UI, its assets and the OpenAPI document', async () => {
    const get = (path: string) => testContext.client.request({ method: 'GET', path });
    const { swaggerUIPath } = testContext.config;

    const page = await get(swaggerUIPath);
    expect(page.statusCode).toBe(200);
    const html = await page.body.text();
    expect(html).toContain('swagger-ui');
    // helmet's default CSP blocks inline scripts, so the page only works if all of them are external.
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);

    const bundle = await get(`${swaggerUIPath}/static/swagger-ui-bundle.js`);
    expect(bundle.statusCode).toBe(200);
    await bundle.body.dump();

    const initializer = await get(`${swaggerUIPath}/static/swagger-initializer.js`);
    expect(initializer.statusCode).toBe(200);
    await initializer.body.dump();

    const spec = await get(`${swaggerUIPath}/json`);
    expect(spec.statusCode).toBe(200);
    const { paths } = (await spec.body.json()) as { paths: Record<string, unknown> };
    expect(paths).toHaveProperty('/vault');
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
        ttl: 1000,
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
    // Keep TTL well above CI scheduling jitter — a 5s TTL previously expired before
    // the GET when this suite ran ~5.2s under load.
    const initialTTL = 30_000;
    const waitMs = 1_000;
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
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
    });

    expect(createResponse.statusCode).toBe(201);
    const { id } = (await createResponse.body.json()) as Record<string, unknown>;
    expect(typeof id).toBe('string');

    const createdAt = Date.now();
    const initialRedisTTL = await testContext.redis.pttl(`vault:${id}`);
    expect(initialRedisTTL).toBeGreaterThan(initialTTL - 250);
    expect(initialRedisTTL).toBeLessThanOrEqual(initialTTL);

    // Under CI CPU contention setTimeout can fire much later than requested; assert
    // against wall-clock elapsed instead of assuming the delay was exact.
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    const getResponse = await testContext.client.request({
      method: 'GET',
      path: `/vault/${id}?h=abc123`,
    });
    expect(getResponse.statusCode).toBe(200);

    const ttlAfterRead = await testContext.redis.pttl(`vault:${id}`);
    const elapsedMs = Date.now() - createdAt;
    // Reading with remaining read-count must preserve the remaining TTL (not reset it).
    expect(ttlAfterRead).toBeGreaterThan(0);
    expect(ttlAfterRead).toBeLessThan(initialRedisTTL);
    expect(Math.abs(ttlAfterRead - (initialTTL - elapsedMs))).toBeLessThan(2_000);

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
        ttl: 1000,
        ips: '192.168.1.1,10.0.0.0/24',
        wh: {
          u: 'https://example.com/webhook',
          n: 'test-webhook',
          r: true,
          b: true,
          fpk: true,
          fip: true,
        },
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
      machine.decrypt(parsedValue.ips, testContext.config.encryptionKey),
      machine.decrypt(parsedValue.wh.u, testContext.config.encryptionKey),
    ]);

    expect(decryptedIps).toBe('192.168.1.1,10.0.0.0/24');
    expect(decryptedWhU).toBe('https://example.com/webhook');
  });

  describe('verification hash and delete token at rest', () => {
    const m = { encryption: { algorithm: 'aes-256-gcm' as const } };
    const createEntry = async (body: Partial<CreateVaultRequest> = {}) => {
      const response = await testContext.client.request({
        method: 'POST',
        path: '/vault',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          c: 'secret-content',
          b: false,
          h: 'abc123',
          ttl: 60_000,
          m,
          ...body,
        } satisfies CreateVaultRequest),
      });
      expect(response.statusCode).toBe(201);
      return (await response.body.json()) as { id: string; dt: string };
    };
    const read = (id: string, h: string) =>
      testContext.client.request({
        method: 'GET',
        path: `/vault/${id}?h=${encodeURIComponent(h)}`,
      });
    const remove = (id: string, dt: string) =>
      testContext.client.request({
        method: 'DELETE',
        path: `/vault/${id}`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dt }),
      });
    const stored = async (id: string) =>
      JSON.parse((await testContext.redis.get(`vault:${id}`))!) as Record<string, unknown>;

    it('stores neither value in plaintext', async () => {
      const { id, dt } = await createEntry();
      const raw = (await testContext.redis.get(`vault:${id}`))!;

      expect(raw).not.toContain('abc123');
      expect(raw).not.toContain(dt);
      expect(machine.isDigest((await stored(id)).h as string)).toBe(true);
      expect(machine.isEncrypted((await stored(id)).dt as string)).toBe(true);
    });

    it('verifies with the original hash and rejects the stored digest', async () => {
      const { id } = await createEntry();
      const { h: storedH } = await stored(id);

      expect((await read(id, storedH as string)).statusCode).toBe(400);
      expect((await read(id, 'abc123')).statusCode).toBe(200);
    });

    it('does not let a stored delete token delete the entry', async () => {
      const { id, dt } = await createEntry();
      const { dt: storedDt } = await stored(id);

      expect((await remove(id, storedDt as string)).statusCode).toBe(404);
      expect((await remove(id, dt)).statusCode).toBe(200);
    });

    it('produces different digests for the same hash on different entries', async () => {
      const [a, b] = await Promise.all([createEntry(), createEntry()]);
      expect((await stored(a.id)).h).not.toBe((await stored(b.id)).h);
    });

    it('still serves entries written before this scheme', async () => {
      const seed = async (id: string, dt: string) =>
        testContext.redis.set(
          `vault:${id}`,
          JSON.stringify({ c: 'c', h: 'legacyhash', b: false, dt, ttl: 60_000, cd: Date.now(), m }),
          'PX',
          60_000,
        );

      await seed('legacy-read', 'legacy-dt-1');
      expect((await read('legacy-read', 'wrong')).statusCode).toBe(400);
      expect((await read('legacy-read', 'legacyhash')).statusCode).toBe(200);
      await testContext.redis.del('vault:legacy-read');

      await seed('legacy-delete', 'legacy-dt-2');
      expect((await remove('legacy-delete', 'nope')).statusCode).toBe(404);
      expect((await remove('legacy-delete', 'legacy-dt-2')).statusCode).toBe(200);
    });

    it('sends the original delete token to webhooks', async () => {
      const messages: Message[] = [];
      const vault = createRedisVault(
        testContext.redis,
        createTokenGenerator({ vaultEntryIdentifierLength: 20, vaultEntryDeleteTokenLength: 20 }),
        { send: async (message) => void messages.push(message) },
        'foobar',
      );
      const { id, dt } = await vault.set({
        c: 'c',
        h: 'abc123',
        b: false,
        ttl: 60_000,
        m,
        wh: { u: 'https://example.com/webhook', r: true, fpk: false, fip: false, b: false },
      });

      await vault.get(id, 'abc123', '127.0.0.1');

      expect(messages).toHaveLength(1);
      expect(messages[0]?.dt).toBe(dt);
    });

    it('fails without using up attempts when the encryption key has changed', async () => {
      const { id } = await createEntry({ fc: 1 });
      const rotated = createRedisVault(
        testContext.redis,
        createTokenGenerator({ vaultEntryIdentifierLength: 20, vaultEntryDeleteTokenLength: 20 }),
        createNopWebhookSender(),
        'a-different-key',
      );

      await expect(rotated.get(id, 'abc123', '127.0.0.1')).rejects.toThrow();

      expect((await stored(id)).fc).toBe(1);
      expect((await read(id, 'abc123')).statusCode).toBe(200);
    });
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
        ttl: 1000,
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
        ttl: 1000,
        fc: 5,
        m: {
          encryption: {
            algorithm: 'aes-256-gcm',
          },
        },
      } satisfies CreateVaultRequest),
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
