/**
 * Custom Logging Middleware — AffordMed
 * Replaces all console.log / built-in loggers per cross-cutting constraint.
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
    ? `${base} | data=${JSON.stringify(entry.data)}`
    : base;
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    data,
  };
  const formatted = formatEntry(entry);

  if (level === "ERROR") {
    process.stderr.write(formatted + "\n");
  } else {
    process.stdout.write(formatted + "\n");
  }
}

export const logger = {
  info:  (context: string, message: string, data?: unknown) => log("INFO",  context, message, data),
  warn:  (context: string, message: string, data?: unknown) => log("WARN",  context, message, data),
  error: (context: string, message: string, data?: unknown) => log("ERROR", context, message, data),
  debug: (context: string, message: string, data?: unknown) => log("DEBUG", context, message, data),
};
