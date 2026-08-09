import { describe, expect, it } from '@jest/globals';
import { BUILD_DEFAULTS, type ExtensionConfig } from './config';
import { parseConfigOverride } from './configSchema';
import { mergeConfigLayers, toCreateOptions } from './configMerge';

const build: ExtensionConfig = {
  apiUrl: BUILD_DEFAULTS.apiUrl,
  webUrl: BUILD_DEFAULTS.webUrl,
  ttl: BUILD_DEFAULTS.ttl,
  burn: BUILD_DEFAULTS.burn,
  ips: BUILD_DEFAULTS.ips,
  rc: BUILD_DEFAULTS.rc,
  fc: BUILD_DEFAULTS.fc,
  webhookUrl: BUILD_DEFAULTS.webhookUrl,
  webhookName: BUILD_DEFAULTS.webhookName,
  webhookOnRead: BUILD_DEFAULTS.webhookOnRead,
  webhookOnFailPassword: BUILD_DEFAULTS.webhookOnFailPassword,
  webhookOnFailIp: BUILD_DEFAULTS.webhookOnFailIp,
  webhookOnBurn: BUILD_DEFAULTS.webhookOnBurn,
};

describe('mergeConfigLayers', () => {
  it('prefers user over managed over build', () => {
    const { config, sources } = mergeConfigLayers(
      build,
      { apiUrl: 'https://managed.example/api', ttl: 3600000 },
      { apiUrl: 'https://user.example/api' },
    );

    expect(config.apiUrl).toBe('https://user.example/api');
    expect(config.ttl).toBe(3600000);
    expect(config.burn).toBe(true);
    expect(sources.apiUrl).toBe('user');
    expect(sources.ttl).toBe('managed');
    expect(sources.burn).toBe('build');
  });

  it('lets user null clear a managed optional', () => {
    const { config, sources } = mergeConfigLayers(build, { ips: '203.0.113.1' }, { ips: null });

    expect(config.ips).toBeUndefined();
    expect(sources.ips).toBe('user');
  });

  it('strips rc when burn is enabled', () => {
    const { config } = mergeConfigLayers(build, {}, { burn: true, rc: 5 });
    expect(config.burn).toBe(true);
    expect(config.rc).toBeUndefined();
  });
});

describe('parseConfigOverride', () => {
  it('keeps valid keys when one key is invalid', () => {
    const { data, errors } = parseConfigOverride({
      apiUrl: 'https://ok.example',
      ttl: 123,
    });

    expect(data.apiUrl).toBe('https://ok.example');
    expect(data.ttl).toBeUndefined();
    expect(errors.some((e) => e.startsWith('ttl:'))).toBe(true);
  });

  it('rejects burn + rc together', () => {
    const { data, errors } = parseConfigOverride({ burn: true, rc: 3 });
    expect(data.rc).toBeUndefined();
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('toCreateOptions', () => {
  it('omits webhook when url is unset', () => {
    expect(toCreateOptions(build).wh).toBeUndefined();
  });

  it('maps webhook fields', () => {
    const options = toCreateOptions({
      ...build,
      burn: false,
      rc: 3,
      webhookUrl: 'https://hooks.example/crypt',
      webhookName: 'n',
      webhookOnRead: true,
      webhookOnFailPassword: true,
      webhookOnFailIp: false,
      webhookOnBurn: true,
    });

    expect(options).toEqual({
      b: false,
      ttl: build.ttl,
      ips: undefined,
      rc: 3,
      fc: undefined,
      wh: {
        u: 'https://hooks.example/crypt',
        n: 'n',
        r: true,
        fpk: true,
        fip: false,
        b: true,
      },
    });
  });
});
