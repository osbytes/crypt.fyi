import { BUILD_DEFAULTS, CONFIG_KEYS, type ConfigOverride, type ExtensionConfig } from './config';

export type ConfigSource = 'user' | 'managed' | 'build';

export type MergedConfig = {
  config: ExtensionConfig;
  /** Which layer supplied each key after merge. */
  sources: Record<keyof ExtensionConfig, ConfigSource>;
  managedKeys: Array<keyof ExtensionConfig>;
  userKeys: Array<keyof ExtensionConfig>;
};

function emptyOptional(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPresent(obj: ConfigOverride, key: keyof ExtensionConfig): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function applyOverrideValue(
  config: ExtensionConfig,
  key: keyof ExtensionConfig,
  value: unknown,
): void {
  // null / empty string = explicit clear (do not fall through to lower layers)
  if (value === null || value === '') {
    if (key === 'burn') {
      config.burn = BUILD_DEFAULTS.burn;
      return;
    }
    if (key === 'webhookOnRead') {
      config.webhookOnRead = BUILD_DEFAULTS.webhookOnRead;
      return;
    }
    if (key === 'webhookOnFailPassword') {
      config.webhookOnFailPassword = BUILD_DEFAULTS.webhookOnFailPassword;
      return;
    }
    if (key === 'webhookOnFailIp') {
      config.webhookOnFailIp = BUILD_DEFAULTS.webhookOnFailIp;
      return;
    }
    if (key === 'webhookOnBurn') {
      config.webhookOnBurn = BUILD_DEFAULTS.webhookOnBurn;
      return;
    }
    (config as Record<string, unknown>)[key] = undefined;
    return;
  }

  (config as Record<string, unknown>)[key] = value;
}

export function buildDefaultsConfig(): ExtensionConfig {
  return {
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
}

/**
 * Seed semantics: user overrides win, then managed (admin seed), then build.
 * Presence in a layer matters — including null/"" clears from the user layer.
 */
export function mergeConfigLayers(
  build: ExtensionConfig,
  managed: ConfigOverride,
  user: ConfigOverride,
): MergedConfig {
  const sources = {} as Record<keyof ExtensionConfig, ConfigSource>;
  const config = { ...build } as ExtensionConfig;
  const managedKeys: Array<keyof ExtensionConfig> = [];
  const userKeys: Array<keyof ExtensionConfig> = [];

  for (const key of CONFIG_KEYS) {
    if (isPresent(user, key)) {
      applyOverrideValue(config, key, user[key]);
      sources[key] = 'user';
      userKeys.push(key);
    } else if (isPresent(managed, key) && managed[key] !== null && managed[key] !== '') {
      applyOverrideValue(config, key, managed[key]);
      sources[key] = 'managed';
      managedKeys.push(key);
    } else {
      sources[key] = 'build';
    }
  }

  // Burn wins over read-count when both somehow survive validation
  if (config.burn) {
    config.rc = undefined;
  }

  config.ips = emptyOptional(config.ips);
  config.webhookUrl = emptyOptional(config.webhookUrl);
  config.webhookName = emptyOptional(config.webhookName);

  return { config, sources, managedKeys, userKeys };
}

/** Build create() payload fields from resolved config (password intentionally omitted). */
export function toCreateOptions(config: ExtensionConfig) {
  const webhookUrl = emptyOptional(config.webhookUrl);

  return {
    b: config.burn,
    ttl: config.ttl,
    ips: emptyOptional(config.ips),
    rc: config.burn ? undefined : config.rc,
    fc: config.fc,
    wh: webhookUrl
      ? {
          u: webhookUrl,
          n: emptyOptional(config.webhookName),
          r: config.webhookOnRead,
          fpk: config.webhookOnFailPassword,
          fip: config.webhookOnFailIp,
          b: config.webhookOnBurn,
        }
      : undefined,
  };
}
