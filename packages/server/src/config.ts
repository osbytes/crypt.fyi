import { z } from 'zod';
import parseBytes from 'bytes';
import parseDuration from 'parse-duration';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

export enum Environment {
  Dev = 'development',
  Test = 'test',
  Prod = 'production',
}

function getEnv(): Environment {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case 'development':
      return Environment.Dev;
    case 'test':
      return Environment.Test;
    case 'production':
      return Environment.Prod;
    default:
      return Environment.Dev;
  }
}

const env = getEnv();

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

const configSchema = z.object({
  shutdownTimeoutMs: z
    .number({ coerce: true })
    .default(1000 * 30)
    .describe('graceful shutdown timeout in milliseconds'),
  port: z.number({ coerce: true }).default(4321).describe('port to listen on for HTTP server'),
  healthCheckEndpoint: z.string().default('/health').describe('endpoint for health check'),
  env: z.nativeEnum(Environment).default(Environment.Dev).describe('environment'),
  logLevel: z.enum(logLevels).default('info').describe('log level'),
  rateLimitMax: z
    .number({ coerce: true })
    .default(10)
    .describe("max requests per 'rate limit time window'"),
  rateLimitWindowMs: z
    .number({ coerce: true })
    .default(1000 * 60)
    .describe('rate limit time window in milliseconds'),
  rateLimitNameSpace: z.string().default('rate-limit:').describe('rate limit namespace'),
  redisUrl: z.string().default('redis://localhost:6379').describe('redis URL'),
  vaultEntryTTLMsMin: z
    .number({ coerce: true })
    .default(1000)
    .describe('vault entry time to live minimum in milliseconds'),
  vaultEntryTTLMsMax: z
    .number({ coerce: true })
    .default(1000 * 60 * 60 * 24 * 7)
    .describe('vault entry time to live maximum in milliseconds'),
  vaultEntryTTLMsDefault: z
    .number({ coerce: true })
    .default(1000 * 60 * 60)
    .describe('vault entry time to live default in milliseconds'),
  vaultEntryIdentifierLength: z
    .number({ coerce: true })
    .default(20)
    .describe('vault entry ID length'),
  vaultEntryDeleteTokenLength: z
    .number({ coerce: true })
    .default(20)
    .describe('vault entry delete token length'),
  bodyLimit: z
    .number()
    .default(1024 * 1024)
    .describe('body limit in bytes'),
  swaggerUIPath: z.string().default('/docs').describe('swagger UI path'),
  corsOrigin: z.string().describe('allowed CORS origins (comma-separated)'),
  corsMethods: z
    .string()
    .default('GET,POST,DELETE,OPTIONS')
    .describe('allowed CORS methods (comma-separated)'),
  corsHeaders: z
    .string()
    .default('Content-Type')
    .describe('allowed CORS headers (comma-separated)'),
  encryptionKey: z.string().describe('encryption key'),
  otelEnabled: z.boolean({ coerce: true }).default(false).describe('enable OpenTelemetry tracing'),
  otelExporterOtlpEndpoint: z.string().describe('OpenTelemetry collector endpoint').optional(),
  serviceName: z
    .string()
    .default(packageJson.name)
    .describe('service name from package.json or env'),
  serviceVersion: z
    .string()
    .default(packageJson.version)
    .describe('service version from package.json or env'),
  serviceDescription: z
    .string()
    .default(packageJson.description)
    .describe('service description from package.json or env'),
  maxIpRestrictions: z.number({ coerce: true }).default(3).describe('max IP restrictions'),
  maxReadCount: z.number({ coerce: true }).default(10).describe('max read count'),
});

export type Config = z.infer<typeof configSchema>;

export const config = (() => {
  let corsOrigin: string | undefined = process.env.CORS_ORIGIN;
  if (!corsOrigin && env !== Environment.Prod) {
    corsOrigin = '*';
  }

  let encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey && env !== Environment.Prod) {
    encryptionKey = 'foobar';
  }

  return configSchema.parse({
    shutdownTimeoutMs: process.env.SHUTDOWN_TIMEOUT_MS,
    port: process.env.PORT,
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT,
    env,
    logLevel: process.env.LOG_LEVEL,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW
      ? parseDuration(process.env.RATE_LIMIT_WINDOW)
      : undefined,
    rateLimitNameSpace: process.env.RATE_LIMIT_NAMESPACE,
    redisUrl: process.env.REDIS_URL,
    vaultEntryTTLMsMin: process.env.VAULT_ENTRY_TTL_MS_MIN,
    vaultEntryTTLMsMax: process.env.VAULT_ENTRY_TTL_MS_MAX,
    vaultEntryTTLMsDefault: process.env.VAULT_ENTRY_TTL_MS_DEFAULT,
    vaultEntryIdentifierLength: process.env.VAULT_ENTRY_IDENTIFIER_LENGTH,
    vaultEntryDeleteTokenLength: process.env.VAULT_ENTRY_DELETE_TOKEN_LENGTH,
    bodyLimit: parseBytes(process.env.BODY_LIMIT_BYTES ?? '100KB'),
    swaggerUIPath: process.env.SWAGGER_UI_PATH,
    corsOrigin,
    corsMethods: process.env.CORS_METHODS,
    corsHeaders: process.env.CORS_HEADERS,
    encryptionKey,
    otelEnabled: process.env.OTEL_ENABLED,
    otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    serviceName: process.env.SERVICE_NAME,
    serviceVersion: process.env.SERVICE_VERSION,
    serviceDescription: process.env.SERVICE_DESCRIPTION,
    maxIpRestrictions: process.env.MAX_IP_RESTRICTIONS,
    maxReadCount: process.env.MAX_READ_COUNT,
  });
})();
