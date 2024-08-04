import pino from "pino";
import { Config } from "./config";

export const initLogging = async (config: Config): Promise<pino.Logger> => {
  return pino({
    level: config.logLevel,
  });
};
