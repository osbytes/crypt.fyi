import browser from 'webextension-polyfill';
import type { ConfigOverride, ExtensionConfig } from './config';
import { parseConfigOverride } from './configSchema';
import {
  buildDefaultsConfig,
  mergeConfigLayers,
  toCreateOptions,
  type ConfigSource,
  type MergedConfig,
} from './configMerge';

export type { ConfigSource };
export { toCreateOptions, mergeConfigLayers, buildDefaultsConfig };

export type ResolvedConfig = MergedConfig & {
  parseErrors: string[];
};

async function readStorageArea(
  area: 'sync' | 'managed',
): Promise<{ data: ConfigOverride; errors: string[] }> {
  try {
    const raw = await browser.storage[area].get(null);
    return parseConfigOverride(raw);
  } catch (error) {
    // Firefox throws when managed storage is unset; Chrome returns {}.
    if (area === 'managed') {
      return { data: {}, errors: [] };
    }
    console.warn(`[crypt.fyi] Failed to read storage.${area}:`, error);
    return { data: {}, errors: [`storage.${area}: ${String(error)}`] };
  }
}

export async function resolveConfig(): Promise<ResolvedConfig> {
  const [managedResult, userResult] = await Promise.all([
    readStorageArea('managed'),
    readStorageArea('sync'),
  ]);

  const merged = mergeConfigLayers(buildDefaultsConfig(), managedResult.data, userResult.data);

  return {
    ...merged,
    parseErrors: [...managedResult.errors, ...userResult.errors],
  };
}

export async function saveUserConfig(override: ConfigOverride): Promise<string[]> {
  const { data, errors } = parseConfigOverride(override);
  if (errors.length > 0 && Object.keys(data).length === 0) {
    return errors;
  }

  // Replace user layer entirely so omitted keys fall back to managed/build
  await browser.storage.sync.clear();
  await browser.storage.sync.set(data);
  return errors;
}

export async function clearUserConfig(): Promise<void> {
  await browser.storage.sync.clear();
}

export type { ExtensionConfig };
