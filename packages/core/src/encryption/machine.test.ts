import {
  encrypt,
  decrypt,
  digest,
  isDigest,
  isEncrypted,
  keyId,
  keyIdOf,
  createKeyring,
  encryptWithKeyring,
  decryptWithKeyring,
  digestWithKeyring,
  digestCandidates,
} from './machine';
import { encrypt as gcmEncrypt } from './gcm';

describe('machine digest', () => {
  const key = 'a-high-entropy-machine-key-0123456789';

  it('is deterministic and prefixed', () => {
    const a = digest('value', key, 'ctx');
    expect(a).toBe(digest('value', key, 'ctx'));
    expect(isDigest(a)).toBe(true);
    expect(a).not.toContain('value');
  });

  it('changes with the value, key and context', () => {
    const base = digest('value', key, 'ctx');
    expect(digest('other', key, 'ctx')).not.toBe(base);
    expect(digest('value', 'another-key', 'ctx')).not.toBe(base);
    expect(digest('value', key, 'other-ctx')).not.toBe(base);
  });

  it('keeps context and value unambiguous', () => {
    expect(digest('bc', key, 'a')).not.toBe(digest('c', key, 'ab'));
  });

  it('does not treat hex hashes or random tokens as digests or ciphertext', () => {
    expect(isDigest('abc123')).toBe(false);
    expect(isEncrypted('abc123')).toBe(false);
  });
});

describe('machine cipher', () => {
  const key = 'a-high-entropy-machine-key-0123456789';

  it('round-trips content', async () => {
    const plaintext = 'https://hooks.example.com/webhook?x=1';
    const enc = await encrypt(plaintext, key);
    expect(enc.startsWith('m1:')).toBe(true);
    expect(isEncrypted(enc)).toBe(true);
    expect(await decrypt(enc, key)).toBe(plaintext);
  });

  it('produces distinct ciphertexts for the same input (random salt+iv)', async () => {
    const a = await encrypt('same', key);
    const b = await encrypt('same', key);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong key', async () => {
    const enc = await encrypt('secret', key);
    await expect(decrypt(enc, 'wrong-key')).rejects.toThrow();
  });

  it('transparently decrypts legacy PBKDF2 (gcm) ciphertext', async () => {
    const plaintext = '10.0.0.0/8,192.168.1.1';
    const legacy = await gcmEncrypt(plaintext, key);
    expect(legacy.startsWith('m1:')).toBe(false);
    expect(await decrypt(legacy, key)).toBe(plaintext);
  });
});

describe('machine keyring', () => {
  const oldKey = 'old-high-entropy-machine-key-0123456789';
  const newKey = 'new-high-entropy-machine-key-9876543210';
  const before = createKeyring(oldKey);
  const rotating = createKeyring(newKey, [oldKey]);
  const after = createKeyring(newKey);

  it('derives a stable, url-safe id that does not contain the key', () => {
    expect(keyId(oldKey)).toBe(keyId(oldKey));
    expect(keyId(oldKey)).not.toBe(keyId(newKey));
    expect(keyId(oldKey)).toMatch(/^[A-Za-z0-9_-]{8}$/);
    expect(oldKey).not.toContain(keyId(oldKey));
  });

  it('uses the first key as primary and ignores duplicates and blanks', () => {
    const keyring = createKeyring(newKey, [oldKey, newKey, '']);
    expect(keyring.primaryId).toBe(keyId(newKey));
    expect([...keyring.keys.keys()]).toEqual([keyId(newKey), keyId(oldKey)]);
    expect(() => createKeyring('')).toThrow();
  });

  it('tags ciphertext with the primary key id', async () => {
    const enc = await encryptWithKeyring('secret', rotating);
    expect(enc.startsWith(`m2:${keyId(newKey)}:`)).toBe(true);
    expect(isEncrypted(enc)).toBe(true);
    expect(keyIdOf(enc)).toBe(keyId(newKey));
    expect(enc).not.toContain('secret');
  });

  it('reads values written before a rotation while writing with the new key', async () => {
    const written = await encryptWithKeyring('secret', before);
    expect(await decryptWithKeyring(written, rotating)).toBe('secret');
    expect(keyIdOf(await encryptWithKeyring('secret', rotating))).toBe(keyId(newKey));
  });

  it('fails once the key a value was written with is removed', async () => {
    const written = await encryptWithKeyring('secret', before);
    await expect(decryptWithKeyring(written, after)).rejects.toThrow();
  });

  it('rejects a ciphertext relabelled with another key id', async () => {
    const written = await encryptWithKeyring('secret', before);
    const relabelled = written.replace(keyId(oldKey), keyId(newKey));
    await expect(decryptWithKeyring(relabelled, rotating)).rejects.toThrow();
  });

  it('reads m1 and legacy PBKDF2 values under any key in the ring', async () => {
    const m1 = await encrypt('m1 value', oldKey);
    const legacy = await gcmEncrypt('legacy value', oldKey);
    expect(await decryptWithKeyring(m1, rotating)).toBe('m1 value');
    expect(await decryptWithKeyring(legacy, rotating)).toBe('legacy value');
    await expect(decryptWithKeyring(m1, after)).rejects.toThrow();
  });

  it('digests with the primary key and tags the digest', () => {
    const d = digestWithKeyring('value', rotating, 'ctx');
    expect(d.startsWith(`hm2:${keyId(newKey)}:`)).toBe(true);
    expect(isDigest(d)).toBe(true);
    expect(d).toBe(digestWithKeyring('value', after, 'ctx'));
    expect(d).not.toBe(digestWithKeyring('value', before, 'ctx'));
  });

  it('matches stored digests by the key they name', () => {
    const stored = digestWithKeyring('value', before, 'ctx');
    expect(digestCandidates(stored, 'value', rotating, 'ctx')).toEqual([stored]);
    expect(digestCandidates(stored, 'other', rotating, 'ctx')).not.toContain(stored);
    expect(digestCandidates(stored, 'value', after, 'ctx')).toEqual([]);
  });

  it('matches hm1 digests under any key and passes pre-digest values through', () => {
    const hm1 = digest('value', oldKey, 'ctx');
    expect(digestCandidates(hm1, 'value', rotating, 'ctx')).toContain(hm1);
    expect(digestCandidates(hm1, 'value', after, 'ctx')).not.toContain(hm1);
    expect(digestCandidates('abc123', 'abc123', rotating, 'ctx')).toEqual(['abc123']);
  });

  it('never accepts the stored digest itself as the value', () => {
    const stored = digestWithKeyring('value', rotating, 'ctx');
    expect(digestCandidates(stored, stored, rotating, 'ctx')).not.toContain(stored);
  });
});
