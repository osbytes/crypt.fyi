import pino from "pino";

export enum Environment {
  Dev,
  Test,
  Prod,
}
const env = getEnv();

export type Config = {
  shutdownTimeoutMs: number;
  port: number;
  healthCheckEndpoint: string;
  env: Environment;
  logLevel: pino.Level;
};

export const initConfig = async (): Promise<Config> => {
  return {
    shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS || "30000"),
    port: parseInt(process.env.PORT || "4321"),
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || "/health",
    env: env,
    logLevel:
      (process.env.LOG_LEVEL?.toLowerCase() as pino.Level | undefined) ||
      "info",
  };
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
