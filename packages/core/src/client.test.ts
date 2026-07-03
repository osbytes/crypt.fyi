import { Client } from './client';

// Minimal in-memory stand-in for the vault API so we can exercise the full
// create -> read crypto pipeline (both layers, verification hash, versioned key)
// without a real server or browser.
type Entry = { c: string; h: string; m: unknown; b: boolean };

const makeFakeServer = () => {
  const store = new Map<string, Entry>();
  let counter = 0;

  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(typeof url === 'string' ? url : url instanceof URL ? url.href : url.url);
    const method = init?.method ?? 'GET';

    if (u.pathname === '/vault' && method === 'POST') {
      const body = JSON.parse(init!.body as string);
      const id = `id${counter++}`;
      store.set(id, { c: body.c, h: body.h, m: body.m, b: body.b });
      return new Response(JSON.stringify({ id, dt: 'delete-token' }), { status: 201 });
    }

    const match = u.pathname.match(/^\/vault\/(.+)$/);
    if (match && method === 'GET') {
      const entry = store.get(match[1]);
      if (!entry) return new Response(null, { status: 404 });
      const h = u.searchParams.get('h');
      if (h !== entry.h) return new Response(null, { status: 400 });
      return new Response(
        JSON.stringify({ c: entry.c, b: entry.b, ttl: 1000, cd: 0, m: entry.m }),
        { status: 200 },
      );
    }

    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;

  return { fetchImpl, store };
};

describe('Client create -> read round trip', () => {
  const origFetch = globalThis.fetch;
  let server: ReturnType<typeof makeFakeServer>;
  let client: Client;

  beforeEach(() => {
    server = makeFakeServer();
    globalThis.fetch = server.fetchImpl;
    client = new Client({ apiUrl: 'http://vault.test' });
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  it('round-trips content without a password (fast path, no version prefix)', async () => {
    const created = await client.create({ c: 'hello world', ttl: 1000, b: false });
    expect(created.key.startsWith('2.')).toBe(false);

    const read = await client.read(created.id, created.key);
    expect(read.c).toBe('hello world');
  });

  it('round-trips content with a password (versioned key + argon2 hash)', async () => {
    const created = await client.create({ c: 'the secret', p: 'hunter2', ttl: 1000, b: false });
    expect(created.key.startsWith('2.')).toBe(true);

    const read = await client.read(created.id, created.key, 'hunter2');
    expect(read.c).toBe('the secret');
  });

  it('rejects a read with the wrong password', async () => {
    const created = await client.create({ c: 'the secret', p: 'hunter2', ttl: 1000, b: false });
    await expect(client.read(created.id, created.key, 'wrong')).rejects.toThrow();
  });

  it('rejects a read missing the required password', async () => {
    const created = await client.create({ c: 'the secret', p: 'hunter2', ttl: 1000, b: false });
    await expect(client.read(created.id, created.key)).rejects.toThrow();
  });

  it('stores the asymmetric password algorithm only when a password is set', async () => {
    const withPw = await client.create({ c: 'x', p: 'pw', ttl: 1000, b: false });
    const withoutPw = await client.create({ c: 'y', ttl: 1000, b: false });

    const pwEntry = server.store.get(withPw.id)!.m as {
      encryption: { algorithm: string; passwordAlgorithm?: string };
    };
    const noPwEntry = server.store.get(withoutPw.id)!.m as {
      encryption: { algorithm: string; passwordAlgorithm?: string };
    };

    expect(pwEntry.encryption.passwordAlgorithm).toBe('ml-kem-768-argon2');
    expect(noPwEntry.encryption.passwordAlgorithm).toBeUndefined();
    expect(noPwEntry.encryption.algorithm).toBe('ml-kem-768-2');
  });
});
