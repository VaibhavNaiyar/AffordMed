/**
 * Custom Logging Middleware — AffordMed Stage 2
 * All application logging must go through this module.
 * Never use console.log directly.
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}] [${entry.context}] ${entry.message}`;
  return entry.data !== undefined
    ? `${base} | ${JSON.stringify(entry.data)}`
    : base;
}

function emit(level: LogLevel, context: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data,
  };
  const formatted = formatEntry(entry);

  // In browser context use console methods (not console.log for info)
  if (typeof window !== "undefined") {
    if (level === "ERROR") {
      console.error(formatted);
    } else if (level === "WARN") {
      console.warn(formatted);
    } else if (level === "DEBUG") {
      console.debug(formatted);
    } else {
      console.info(formatted);
    }
  } else {
    // Server-side (Next.js SSR / API routes)
    if (level === "ERROR") {
      process.stderr.write(formatted + "\n");
    } else {
      process.stdout.write(formatted + "\n");
    }
  }
}

export const logger = {
  info:  (context: string, message: string, data?: unknown) => emit("INFO",  context, message, data),
  warn:  (context: string, message: string, data?: unknown) => emit("WARN",  context, message, data),
  error: (context: string, message: string, data?: unknown) => emit("ERROR", context, message, data),
  debug: (context: string, message: string, data?: unknown) => emit("DEBUG", context, message, data),
};
