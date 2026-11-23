import { describe, expect, it } from 'vitest';
import { ErrorUnexpectedStatus } from '@crypt.fyi/core';
import { DEFAULT_TTL } from './config';
import { buildCreateInput, buildSecretUrl, describeCreateError } from './secret';

describe('buildCreateInput', () => {
  const base = { content: 'line one\n  line two  ', password: '', ttl: DEFAULT_TTL, burn: true };

  it('passes content through untouched and omits an empty password', () => {
    expect(buildCreateInput(base)).toEqual({
      ok: true,
      input: { c: 'line one\n  line two  ', b: true, ttl: DEFAULT_TTL },
    });
  });

  it('includes a password when one is set', () => {
    const result = buildCreateInput({ ...base, password: ' pw ', burn: false });
    expect(result).toEqual({
      ok: true,
      input: { c: base.content, p: ' pw ', b: false, ttl: DEFAULT_TTL },
    });
  });

  it('rejects empty and whitespace-only content', () => {
    expect(buildCreateInput({ ...base, content: '' })).toEqual({ ok: false, error: 'empty' });
    expect(buildCreateInput({ ...base, content: ' \n\t ' })).toEqual({
      ok: false,
      error: 'empty',
    });
  });

  it('rejects a TTL the server does not offer', () => {
    expect(buildCreateInput({ ...base, ttl: 1234 })).toEqual({ ok: false, error: 'invalidTtl' });
  });
});

describe('buildSecretUrl', () => {
  it('keeps the key in the fragment', () => {
    expect(
      buildSecretUrl({
        webUrl: 'https://crypt.fyi/',
        id: 'abc123',
        key: 'k3y',
        passwordProtected: false,
      }),
    ).toBe('https://crypt.fyi/abc123#k3y');
  });

  it('flags password-protected secrets and keeps a self-hosted base path', () => {
    expect(
      buildSecretUrl({
        webUrl: 'https://example.com/secrets',
        id: 'a/b',
        key: 'v2.k3y',
        passwordProtected: true,
      }),
    ).toBe('https://example.com/secrets/a%2Fb?p=true#v2.k3y');
  });
});

describe('describeCreateError', () => {
  const apiUrl = 'https://api.crypt.fyi';

  it('maps known HTTP statuses', () => {
    expect(describeCreateError(new ErrorUnexpectedStatus(429), apiUrl)).toEqual({
      key: 'desktop.errors.rateLimited',
    });
    expect(describeCreateError(new ErrorUnexpectedStatus(413), apiUrl)).toEqual({
      key: 'desktop.errors.tooLarge',
    });
    expect(describeCreateError(new ErrorUnexpectedStatus(500), apiUrl)).toEqual({
      key: 'desktop.errors.server',
      vars: { status: 500 },
    });
  });

  it('reports network failures with the API host only', () => {
    expect(describeCreateError(new TypeError('Failed to fetch'), apiUrl)).toEqual({
      key: 'desktop.errors.network',
      vars: { host: 'api.crypt.fyi' },
    });
  });

  it('never echoes arbitrary error messages', () => {
    expect(describeCreateError(new Error('something sensitive'), apiUrl)).toEqual({
      key: 'desktop.errors.unknown',
    });
  });
});
