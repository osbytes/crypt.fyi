import pino from "pino";

export type Config = {
    shutdownTimeoutMs: number;
    port: number;
    healthCheckEndpoint: string;
    env: Env;
    logLevel: pino.Level;
}

export const initConfig = async (): Promise<Config> => {
    return {
        shutdownTimeoutMs: parseInt(process.env.SHUTDOWN_TIMEOUT_MS || "30000"),
        port: parseInt(process.env.PORT || "4321"),
        healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || "/health",
        env: getEnv(),
        logLevel: process.env.LOG_LEVEL?.toLowerCase() as pino.Level | undefined || "info",
    }
}

export enum Env {
    Dev,
    Test,
    Prod,
}

const getEnv = (): Env => {
    switch (process.env.NODE_ENV?.toLowerCase()) {
        case "development": return Env.Dev
        case "test": return Env.Test
        case "production": return Env.Prod
        default: return Env.Dev
    }
}
