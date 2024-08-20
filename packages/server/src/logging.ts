import pino from "pino";
import { Config } from "./config";

export const initLogging = async (config: Config): Promise<pino.Logger> => {
  return pino({
    level: config.logLevel,
  });
};

interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: any[]): void;
  (obj: unknown, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export interface Logger {
  level:
    | "silent"
    | "fatal"
    | "error"
    | "warn"
    | "info"
    | "debug"
    | "trace"
    | (string & {});
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  silent: LogFn;
  child: (obj: Record<string, unknown>) => Logger;
}
