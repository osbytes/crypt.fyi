import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp } from './app.js';
import { config as baseConfig, type Config } from './config.js';
import type { AddressInfo } from 'node:net';
import { pino } from 'pino';
import { createRedisVault } from './vault/redis.js';
import { createTokenGenerator } from './vault/tokens.js';
import { createRedisUploadStore } from './vault/uploads.js';
import { createNopWebhookSender } from './webhook.js';
import { createMemoryBlobStorage } from './storage/memory.js';
import { buildObjectKey } from './storage/index.js';
import { MIN_PART_SIZE } from './storage/types.js';
import { Redis } from 'ioredis';
import { Client } from 'undici';

// Small enough to keep the suite quick, large enough that a payload still needs
// several parts. The storage minimum is what forces the shape of these tests.
const PART = MIN_PART_SIZE;

const initStreamTest = async (overrides: Partial<Config> = {}) => {
  const config = {
    ...baseConfig,
    healthCheckEndpoint: '/some-health-check-endpoint',
    vaultEntryTTLMsDefault: 60_000,
    rateLimiter: 'memory',
    rateLimitMax: Number.MAX_SAFE_INTEGER,
    blobStorageEnabled: true,
    blobStorageType: 'memory',
    allowPersistence: false,
    maxUploadPartBytes: 32 * 1024 * 1024,
    ...overrides,
  } satisfies Config;

  const logger = pino({ enabled: false });
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379');
  const vault = createRedisVault(
    redis,
    createTokenGenerator({
      vaultEntryIdentifierLength: config.vaultEntryIdentifierLength,
      vaultEntryDeleteTokenLength: config.vaultEntryDeleteTokenLength,
    }),
    createNopWebhookSender(),
    'foobar',
  );
  const blobStorage = createMemoryBlobStorage();

  const app = await initApp(config, {
    logger,
    vault,
    redis,
    blobStorage,
    uploadStore: createRedisUploadStore(redis),
  });
  await app.fastify.listen();

  const port = (app.fastify.server.address() as AddressInfo).port;
  return {
    config,
    app,
    redis,
    blobStorage,
    client: new Client(`http://localhost:${port}`),
  };
};

type Ctx = Awaited<ReturnType<typeof initStreamTest>>;

const openUpload = async (ctx: Ctx, body: Record<string, unknown>) => {
  const res = await ctx.client.request({
    method: 'POST',
    path: '/vault/stream',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      h: 'hash-abc',
      b: true,
      ttl: 60_000,
      m: { encryption: { algorithm: 'ml-kem-768-stream' } },
      ...body,
    }),
  });
  return { status: res.statusCode, body: (await res.body.json()) as Record<string, string> };
};

const putPart = (ctx: Ctx, id: string, ut: string, n: number, payload: Buffer) =>
  ctx.client.request({
    method: 'PUT',
    path: `/vault/stream/${id}/parts/${n}?ut=${encodeURIComponent(ut)}`,
    headers: { 'Content-Type': 'application/octet-stream' },
    body: payload,
  });

const complete = (ctx: Ctx, id: string, ut: string) =>
  ctx.client.request({
    method: 'POST',
    path: `/vault/stream/${id}/complete`,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ut }),
  });

const fill = (size: number, seed: number) => Buffer.alloc(size, seed);

describe('streamed payloads', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await initStreamTest();
  });

  afterEach(async () => {
    await ctx.app.shutdown();
    await ctx.app.fastify.close();
    await ctx.client.close();
  });

  it('uploads in parts, then reads the payload back byte for byte', async () => {
    const first = fill(PART, 0x11);
    const last = fill(1024, 0x22);
    const size = first.length + last.length;

    const { status, body } = await openUpload(ctx, { size, frames: 2 });
    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
    expect(body.ut).toBeTruthy();

    expect((await putPart(ctx, body.id, body.ut, 1, first)).statusCode).toBe(204);
    expect((await putPart(ctx, body.id, body.ut, 2, last)).statusCode).toBe(204);
    expect((await complete(ctx, body.id, body.ut)).statusCode).toBe(201);

    const read = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(read.statusCode).toBe(200);
    expect(read.headers['content-type']).toBe('application/octet-stream');
    expect(read.headers['x-crypt-burned']).toBe('true');
    expect(read.headers['x-crypt-frames']).toBe('2');

    const received = Buffer.from(await read.body.arrayBuffer());
    expect(received.length).toBe(size);
    expect(received.equals(Buffer.concat([first, last]))).toBe(true);
  });

  it('does not expose the entry until the upload completes', async () => {
    const payload = fill(1024, 0x33);
    const { body } = await openUpload(ctx, { size: payload.length, frames: 1 });

    // The vault entry is only written on completion, so mid-upload the id is
    // indistinguishable from one that never existed.
    const early = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(early.statusCode).toBe(404);
    await early.body.dump();

    const head = await ctx.client.request({ method: 'HEAD', path: `/vault/${body.id}` });
    expect(head.statusCode).toBe(404);
    await head.body.dump();

    await putPart(ctx, body.id, body.ut, 1, payload);
    await complete(ctx, body.id, body.ut);

    const after = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(after.statusCode).toBe(200);
    await after.body.dump();
  });

  it('burns the stored object once the download has landed', async () => {
    const payload = fill(2048, 0x44);
    const { body } = await openUpload(ctx, { size: payload.length, frames: 1 });
    await putPart(ctx, body.id, body.ut, 1, payload);
    await complete(ctx, body.id, body.ut);

    expect(ctx.blobStorage.size()).toBe(1);

    const read = await ctx.client.request({ method: 'GET', path: `/vault/${body.id}?h=hash-abc` });
    await read.body.arrayBuffer();

    // The delete is scheduled on stream end; give the event loop a turn.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(ctx.blobStorage.size()).toBe(0);

    const second = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(second.statusCode).toBe(404);
    await second.body.dump();
  });

  it('rejects an unknown or mismatched upload token', async () => {
    const payload = fill(1024, 0x55);
    const { body } = await openUpload(ctx, { size: payload.length, frames: 1 });

    const wrongToken = await putPart(ctx, body.id, 'not-the-token', 1, payload);
    expect(wrongToken.statusCode).toBe(404);
    await wrongToken.body.dump();

    const wrongId = await putPart(ctx, 'nonexistent-id', body.ut, 1, payload);
    expect(wrongId.statusCode).toBe(404);
    await wrongId.body.dump();
  });

  it('rejects a non-final part below the storage minimum', async () => {
    const size = PART + 4096;
    const { body } = await openUpload(ctx, { size, frames: 2 });

    // Too small to be a non-final part, and it does not finish the payload.
    const undersized = await putPart(ctx, body.id, body.ut, 1, fill(4096, 0x66));
    expect(undersized.statusCode).toBe(409);
    await undersized.body.dump();
  });

  it('rejects a part that would exceed the declared size', async () => {
    const { body } = await openUpload(ctx, { size: 1024, frames: 1 });

    const tooBig = await putPart(ctx, body.id, body.ut, 1, fill(2048, 0x77));
    expect(tooBig.statusCode).toBe(409);
    await tooBig.body.dump();
  });

  it('rejects a duplicate part number', async () => {
    const first = fill(PART, 0x88);
    const last = fill(512, 0x99);
    const { body } = await openUpload(ctx, { size: first.length + last.length, frames: 2 });

    expect((await putPart(ctx, body.id, body.ut, 1, first)).statusCode).toBe(204);
    const duplicate = await putPart(ctx, body.id, body.ut, 1, first);
    expect(duplicate.statusCode).toBe(409);
    await duplicate.body.dump();
  });

  it('refuses to complete when the uploaded bytes do not match the declaration', async () => {
    const { body } = await openUpload(ctx, { size: PART + 1024, frames: 2 });
    await putPart(ctx, body.id, body.ut, 1, fill(PART, 0xaa));

    const early = await complete(ctx, body.id, body.ut);
    expect(early.statusCode).toBe(409);
    await early.body.dump();

    // The entry must not have been published by the failed completion.
    const read = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(read.statusCode).toBe(404);
    await read.body.dump();
  });

  it('releases the stored object when the delete token is used', async () => {
    const payload = fill(1024, 0xbb);
    const { body } = await openUpload(ctx, { size: payload.length, frames: 1, b: false });
    await putPart(ctx, body.id, body.ut, 1, payload);
    await complete(ctx, body.id, body.ut);
    expect(ctx.blobStorage.size()).toBe(1);

    const deleted = await ctx.client.request({
      method: 'DELETE',
      path: `/vault/${body.id}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dt: body.dt }),
    });
    expect(deleted.statusCode).toBe(200);
    await deleted.body.dump();
    expect(ctx.blobStorage.size()).toBe(0);
  });

  it('rejects a payload larger than the configured maximum', async () => {
    const { status } = await openUpload(ctx, {
      size: ctx.config.maxBlobBytes + 1,
      frames: 1,
    });
    expect(status).toBe(400);
  });

  it('keeps the inline path working unchanged', async () => {
    const created = await ctx.client.request({
      method: 'POST',
      path: '/vault',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        c: 'inline-secret',
        b: true,
        h: 'inline-hash',
        ttl: 60_000,
        m: { encryption: { algorithm: 'aes-256-gcm' } },
      }),
    });
    expect(created.statusCode).toBe(201);
    const { id } = (await created.body.json()) as { id: string };

    const read = await ctx.client.request({ method: 'GET', path: `/vault/${id}?h=inline-hash` });
    expect(read.statusCode).toBe(200);
    expect(read.headers['content-type']).toContain('application/json');
    const payload = (await read.body.json()) as { c: string };
    expect(payload.c).toBe('inline-secret');
  });
});

describe('streamed payloads / retention', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await initStreamTest({ allowPersistence: true });
  });

  afterEach(async () => {
    await ctx.app.shutdown();
    await ctx.app.fastify.close();
    await ctx.client.close();
  });

  it('keeps the object after a burn when persistence is allowed', async () => {
    const payload = fill(1024, 0xcc);
    const { body } = await openUpload(ctx, { size: payload.length, frames: 1 });
    await putPart(ctx, body.id, body.ut, 1, payload);
    await complete(ctx, body.id, body.ut);

    const read = await ctx.client.request({ method: 'GET', path: `/vault/${body.id}?h=hash-abc` });
    await read.body.arrayBuffer();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // The link is dead but the bytes survive — the point of the retention flag.
    const second = await ctx.client.request({
      method: 'GET',
      path: `/vault/${body.id}?h=hash-abc`,
    });
    expect(second.statusCode).toBe(404);
    await second.body.dump();
    expect(ctx.blobStorage.size()).toBe(1);
  });
});

describe('object keys', () => {
  it('partitions by UTC date and carries no filename', () => {
    const key = buildObjectKey('secrets', 'AbC123', new Date(Date.UTC(2026, 7, 15, 23, 30)));
    expect(key).toBe('secrets/2026/08/15/AbC123');
  });

  it('tolerates a prefix with stray slashes and an empty prefix', () => {
    const at = new Date(Date.UTC(2026, 0, 2));
    expect(buildObjectKey('/nested/prefix/', 'xyz', at)).toBe('nested/prefix/2026/01/02/xyz');
    expect(buildObjectKey('', 'xyz', at)).toBe('2026/01/02/xyz');
  });
});
