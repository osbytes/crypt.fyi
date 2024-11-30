import pino from 'pino';
import { initApp } from './app';
import { initConfig, Config } from './config';

import tap, { Test } from 'tap';
import { Client } from 'undici';
import { AddressInfo } from 'node:net';
import Redis from 'ioredis';
import { createRedisVault } from './vault/redis';

const initAppTest = async (t: Test) => {
  const config = {
    ...(await initConfig()),
    healthCheckEndpoint: '/some-health-check-endpoint',
    vaultEntryTTLMsDefault: 1000,
  } satisfies Config;
  const logger = pino({ enabled: false });
  const redis = new Redis();
  const vault = createRedisVault(redis, config);
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
        p: true,
      }),
    });

    t.equal(createResponse.statusCode, 201);
    const { id, dt } = (await createResponse.body.json()) as Record<string, unknown>;
    t.equal(typeof id, 'string');
    t.equal(typeof dt, 'string');

    const getResponse1 = await client.request({
      method: 'GET',
      path: `/vault/${id}`,
    });
    t.equal(getResponse1.statusCode, 200);
    const { c, b, p } = (await getResponse1.body.json()) as Record<string, unknown>;
    t.equal(c, 'foobar');
    t.equal(b, true);
    t.equal(p, true);

    const getResponse2 = await client.request({
      method: 'GET',
      path: `/vault/${id}`,
    });
    t.equal(getResponse2.statusCode, 404);
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
        p: true,
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
      path: `/vault/${id}`,
    });
    t.equal(getResponse.statusCode, 404);
  });
});
