import pino from 'pino';
import { initApp } from './app';
import { initConfig } from './config';

import tap, { Test } from 'tap';
import { Client } from 'undici';
import { AddressInfo } from 'node:net';

const initAppTest = async (t: Test) => {
    const config = {
        ...(await initConfig()),
        healthCheckEndpoint: '/some-health-check-endpoint',
    };
    const app = await initApp(config, pino({ enabled: false }));
    await app.fastify.listen();
    const baseUrl = `http://localhost:${
        (app.fastify.server.address() as AddressInfo).port
    }`;
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

    t.test('should respond properly to "hi"', async (t) => {
        const response = await client.request({
            method: 'GET',
            path: '/hi',
        });

        const body = await response.body.text();
        t.equal(response.statusCode, 200);
        t.equal(body, 'hi');
    });
});
