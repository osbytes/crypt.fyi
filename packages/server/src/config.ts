import { z } from "zod";
import bytes from "bytes";

export enum Environment {
  Dev = "development",
  Test = "test",
  Prod = "production",
}

const logLevels = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

const configSchema = z.object({
  shutdownTimeoutMs: z
    .number({ coerce: true })
    .default(1000 * 30)
    .describe("graceful shutdown timeout in milliseconds"),
  port: z
    .number({ coerce: true })
    .default(4321)
    .describe("port to listen on for HTTP server"),
  healthCheckEndpoint: z
    .string()
    .default("/health")
    .describe("endpoint for health check"),
  env: z
    .nativeEnum(Environment)
    .default(Environment.Dev)
    .describe("environment"),
  logLevel: z.enum(logLevels).default("info").describe("log level"),
  rateLimitMax: z
    .number({ coerce: true })
    .default(100)
    .describe("max requests per 'rate limit time window'"),
  rateLimitWindowMs: z
    .number({ coerce: true })
    .default(1000 * 60)
    .describe("rate limit time window in milliseconds"),
  rateLimitNameSpace: z
    .string()
    .default("rate-limit:")
    .describe("rate limit namespace"),
  redisUrl: z.string().default("redis://localhost:6379").describe("redis URL"),
  vaultEntryTTLMsMin: z
    .number({ coerce: true })
    .default(1)
    .describe("vault entry time to live minimum in milliseconds"),
  vaultEntryTTLMsMax: z
    .number({ coerce: true })
    .default(1000 * 60 * 60)
    .describe("vault entry time to live maximum in milliseconds"),
  vaultEntryTTLMsDefault: z
    .number({ coerce: true })
    .default(1000 * 60 * 5)
    .describe("vault entry time to live default in milliseconds"),
  vaultEntryIdentifierLength: z
    .number({ coerce: true })
    .default(20)
    .describe("vault entry ID length"),
  vaultEntryDeleteTokenLength: z
    .number({ coerce: true })
    .default(20)
    .describe("vault entry delete token length"),
  bodyLimit: z
    .number()
    .default(1024 * 1024)
    .describe("body limit in bytes"),
  swaggerUIPath: z.string().default("/docs").describe("swagger UI path"),
});

export type Config = z.infer<typeof configSchema>;

export const initConfig = async (): Promise<Config> => {
  return configSchema.parse({
    shutdownTimeoutMs: process.env.SHUTDOWN_TIMEOUT_MS,
    port: process.env.PORT,
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT,
    env: getEnv(),
    logLevel: process.env.LOG_LEVEL,
    rateLimitMax: process.env.RATE_LIMIT_MAX,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitNameSpace: process.env.RATE_LIMIT_NAMESPACE,
    redisUrl: process.env.REDIS_URL,
    vaultEntryTTLMsMin: process.env.VAULT_ENTRY_TTL_MS_MIN,
    vaultEntryTTLMsMax: process.env.VAULT_ENTRY_TTL_MS_MAX,
    vaultEntryTTLMsDefault: process.env.VAULT_ENTRY_TTL_MS_DEFAULT,
    vaultEntryIdentifierLength: process.env.VAULT_ENTRY_IDENTIFIER_LENGTH,
    vaultEntryDeleteTokenLength: process.env.VAULT_ENTRY_DELETE_TOKEN_LENGTH,
    bodyLimit: bytes(process.env.BODY_LIMIT_BYTES ?? "50KB"),
    swaggerUIPath: process.env.SWAGGER_UI_PATH,
  });
};

function getEnv(): Environment {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case "development":
      return Environment.Dev;
    case "test":
      return Environment.Test;
    case "production":
      return Environment.Prod;
    default:
      return Environment.Dev;
  }
}
