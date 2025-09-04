import { z } from 'zod';
import parseBytes from 'bytes';
import parseDuration from 'parse-duration';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  shutdownTimeoutMs: z.coerce
    .number()
    .default(1000 * 30)
    .describe('graceful shutdown timeout in milliseconds'),
  port: z.coerce.number().default(4321).describe('port to listen on for HTTP server'),
  healthCheckEndpoint: z.string().default('/health').describe('endpoint for health check'),
  env: z.nativeEnum(Environment).default(Environment.Dev).describe('environment'),
  logLevel: z.enum(logLevels).default('info').describe('log level'),
  rateLimitMax: z.coerce.number().default(10).describe("max requests per 'rate limit time window'"),
  rateLimitWindowMs: z.coerce
    .number()
    .default(1000 * 60)
    .describe('rate limit time window in milliseconds'),
  rateLimitNameSpace: z.string().default('rate-limit:').describe('rate limit namespace'),
  redisUrl: z.string().default('redis://localhost:6379').describe('redis URL'),
  vaultEntryTTLMsMin: z.coerce
    .number()
    .default(1000)
    .describe('vault entry time to live minimum in milliseconds'),
  vaultEntryTTLMsMax: z.coerce
    .number()
    .default(1000 * 60 * 60 * 24 * 7)
    .describe('vault entry time to live maximum in milliseconds'),
  vaultEntryTTLMsDefault: z.coerce
    .number()
    .default(1000 * 60 * 60)
    .describe('vault entry time to live default in milliseconds'),
  vaultEntryIdentifierLength: z.coerce.number().default(20).describe('vault entry ID length'),
  vaultEntryDeleteTokenLength: z.coerce
    .number()
    .default(20)
    .describe('vault entry delete token length'),
  bodyLimit: z
    .number()
    .default(1024 * 1024)
    .describe('body limit in bytes'),
  swaggerUIPath: z.string().default('/docs').describe('swagger UI path'),
  corsOrigin: z
    .string()
    .default('*')
    .describe(
      'allowed CORS origins (comma-separated) https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin',
    ),
  corsMethods: z
    .string()
    .default('*')
    .describe(
      'allowed CORS methods (comma-separated) https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods',
    ),
  corsHeaders: z
    .string()
    .default('*')
    .describe(
      'allowed CORS headers (comma-separated) https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers',
    ),
  encryptionKey: z.string().describe('encryption key'),
  otelEnabled: z.coerce.boolean().default(false).describe('enable OpenTelemetry tracing'),
  otelExporterOtlpEndpoint: z.string().describe('OpenTelemetry collector endpoint').optional(),
  otelExporterOtlpHeaders: z.record(z.string(), z.string()).describe('OpenTelemetry collector headers').optional(),
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
  maxIpRestrictions: z.coerce.number().default(3).describe('max IP restrictions'),
  maxReadCount: z.coerce.number().default(10).describe('max read count'),
  webhookRequestTimeoutMs: z.coerce
    .number()
    .default(3_000)
    .describe('webhook request timeout in milliseconds'),
  webhookMaxAttempts: z.coerce
    .number()
    .default(5)
    .describe('maximum number of webhook delivery attempts'),
  webhookBackoffType: z
    .enum(['fixed', 'exponential'])
    .default('exponential')
    .describe('webhook retry backoff strategy type'),
  webhookBackoffDelayMs: z.coerce
    .number()
    .default(5_000)
    .describe('webhook retry backoff delay in milliseconds'),
  webhookRemoveOnComplete: z.coerce
    .boolean()
    .default(true)
    .describe('remove webhook jobs from queue when complete'),
  webhookRemoveOnFail: z.coerce
    .boolean()
    .default(true)
    .describe('remove webhook jobs from queue when failed'),
  webhookConcurrency: z.coerce.number().default(50).describe('number of concurrent webhook jobs'),
  webhookDrainDelayMs: z.coerce
    .number()
    .default(15_000)
    .describe('number of milliseconds to long poll for jobs when the queue is empty.'),
  webhookStreamEventsMaxLength: z.coerce
    .number()
    .default(100)
    .describe('maximum length of webhook events stream'),
  webhookSender: z.enum(['bullmq', 'http']).default('bullmq').describe('webhook sender type'),
  rateLimiter: z.enum(['redis', 'memory']).default('redis').describe('rate limiter type'),
});

export type Config = z.infer<typeof configSchema>;

export const config = (() => {
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
    corsOrigin: process.env.CORS_ORIGIN,
    corsMethods: process.env.CORS_METHODS,
    corsHeaders: process.env.CORS_HEADERS,
    encryptionKey,
    otelEnabled: process.env.OTEL_ENABLED,
    otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    otelExporterOtlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : undefined,
    serviceName: process.env.SERVICE_NAME,
    serviceVersion: process.env.SERVICE_VERSION,
    serviceDescription: process.env.SERVICE_DESCRIPTION,
    maxIpRestrictions: process.env.MAX_IP_RESTRICTIONS,
    maxReadCount: process.env.MAX_READ_COUNT,
    webhookRequestTimeoutMs: process.env.WEBHOOK_REQUEST_TIMEOUT_MS,
    webhookMaxAttempts: process.env.WEBHOOK_MAX_ATTEMPTS,
    webhookBackoffType: process.env.WEBHOOK_BACKOFF_TYPE,
    webhookBackoffDelayMs: process.env.WEBHOOK_BACKOFF_DELAY_MS,
    webhookRemoveOnComplete: process.env.WEBHOOK_REMOVE_ON_COMPLETE,
    webhookRemoveOnFail: process.env.WEBHOOK_REMOVE_ON_FAIL,
    webhookConcurrency: process.env.WEBHOOK_CONCURRENCY,
    webhookDrainDelayMs: process.env.WEBHOOK_DRAIN_DELAY_MS,
    webhookStreamEventsMaxLength: process.env.WEBHOOK_STREAM_EVENTS_MAX_LENGTH,
    webhookSender: process.env.WEBHOOK_SENDER,
    rateLimiter: process.env.RATE_LIMITER,
  });
})();
