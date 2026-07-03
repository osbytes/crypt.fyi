import { isPrivateIp, isValidWebhookUrl, validateWebhookUrl, SsrfError } from './ssrf';

describe('isPrivateIp', () => {
  it.each([
    '127.0.0.1',
    '0.0.0.0',
    '10.1.2.3',
    '172.16.5.4',
    '172.31.255.255',
    '192.168.0.1',
    '169.254.169.254', // cloud metadata
    '100.64.0.1', // CGNAT
    '198.18.0.1', // benchmarking
    '224.0.0.1', // multicast
    '255.255.255.255', // broadcast
    '::1', // loopback
    '::', // unspecified
    'fc00::1', // ULA
    'fd12:3456::1', // ULA
    'fe80::1', // link-local
    'ff02::1', // multicast
    '::ffff:127.0.0.1', // v4-mapped loopback
    '::ffff:169.254.169.254', // v4-mapped metadata
  ])('classifies %s as private', (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:2800:220:1::1', '2001:4860:4860::8888'])(
    'classifies %s as public',
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false);
    },
  );
});

describe('validateWebhookUrl', () => {
  it('rejects private/reserved literal IP hosts', () => {
    for (const url of [
      'http://169.254.169.254/latest/meta-data/',
      'http://127.0.0.1:6379',
      'http://10.0.0.5/hook',
      'https://[::1]/hook',
      'http://[fe80::1]/hook',
    ]) {
      expect(() => validateWebhookUrl(url, { requireHttps: false })).toThrow(SsrfError);
    }
  });

  it('rejects internal hostnames', () => {
    for (const url of [
      'http://localhost/hook',
      'http://metadata.google.internal/computeMetadata/v1/',
      'http://foo.local/hook',
    ]) {
      expect(() => validateWebhookUrl(url, { requireHttps: false })).toThrow(SsrfError);
    }
  });

  it('rejects disallowed schemes', () => {
    expect(() => validateWebhookUrl('ftp://example.com', { requireHttps: false })).toThrow(SsrfError);
    expect(() => validateWebhookUrl('http://example.com', { requireHttps: true })).toThrow(SsrfError);
  });

  it('accepts public https URLs', () => {
    expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
    expect(isValidWebhookUrl('https://hooks.slack.com/services/T/B/x')).toBe(true);
  });

  it('accepts public http URLs only when https is not required', () => {
    expect(isValidWebhookUrl('http://example.com/webhook', { requireHttps: false })).toBe(true);
    expect(isValidWebhookUrl('http://example.com/webhook', { requireHttps: true })).toBe(false);
  });
});
