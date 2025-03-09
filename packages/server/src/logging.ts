import { pino } from 'pino';
import type { Config } from './config.js';
import type { FastifyRequest } from 'fastify';

// Strip query parameters from URLs to prevent logging sensitive data
const stripQueryParams = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, just remove everything after '?'
    return url.split('?')[0];
  }
};

export const initLogging = async (config: Config): Promise<pino.Logger> => {
  return pino({
    level: config.logLevel,
    base: {
      env: config.env,
      service: config.serviceName,
      version: config.serviceVersion,
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      // https://fastify.dev/docs/v2.15.x/Documentation/Logging/#log-redaction
      req(request: FastifyRequest) {
        return {
          method: request.method,
          url: stripQueryParams(request.url),
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort,
          xClient: request.headers['x-client'],
          userAgent: request.headers['user-agent'],
        };
      },
    },
  });
};

interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: unknown[]): void;
  (obj: unknown, msg?: string, ...args: unknown[]): void;
  (msg: string, ...args: unknown[]): void;
}

export interface Logger {
  level: 'silent' | 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | (string & {});
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  silent: LogFn;
  child: (obj: Record<string, unknown>) => Logger;
}
