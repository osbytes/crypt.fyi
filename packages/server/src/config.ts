import { z } from "zod";

export enum Environment {
  Dev,
  Test,
  Prod,
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
});

export type Config = z.infer<typeof configSchema>;

export const initConfig = async (): Promise<Config> => {
  return configSchema.parse({
    shutdownTimeoutMs: process.env.SHUTDOWN_TIMEOUT_MS,
    port: process.env.PORT,
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT,
    env: getEnv(),
    logLevel: process.env.LOG_LEVEL,
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
