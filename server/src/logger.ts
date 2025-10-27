import { env } from "@/env";

type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const levelWeights: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const activeThreshold = levelWeights[env.LOG_LEVEL];

const shouldLog = (level: LogLevel) => levelWeights[level] <= activeThreshold;

const format = (level: LogLevel, message: string, meta?: unknown) => {
  const payload = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  return payload;
};

const log = (level: LogLevel, message: string, meta?: unknown) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = format(level, message, meta);

  if (level === "error" || level === "fatal") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
};

export const logger = {
  fatal: (message: string, meta?: unknown) => log("fatal", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  info: (message: string, meta?: unknown) => log("info", message, meta),
  debug: (message: string, meta?: unknown) => log("debug", message, meta),
  trace: (message: string, meta?: unknown) => log("trace", message, meta),
};
