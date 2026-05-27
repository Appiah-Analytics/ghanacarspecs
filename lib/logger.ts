import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const secretKeyPattern = /(secret|password|token|authorization|api[-_]?key|cookie)/i;

function parseLevel(raw: string | undefined): LogLevel {
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw;
  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (value == null) return value;
  if (secretKeyPattern.test(key)) return "[REDACTED]";
  if (typeof value === "string" && value.length > 2000) return `${value.slice(0, 2000)}...[truncated]`;
  return value;
}

function sanitizeContext(context: LogContext): LogContext {
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [key, sanitizeValue(key, value)]));
}

function getRequestId(request: Request): string {
  return (
    request.headers.get("x-request-id") ??
    request.headers.get("x-correlation-id") ??
    (typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`)
  );
}

function getPathname(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

function emit(level: LogLevel, message: string, context: LogContext = {}) {
  const configuredLevel = parseLevel(process.env.LOG_LEVEL);
  if (levelOrder[level] < levelOrder[configuredLevel]) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeContext(context),
  };
  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function withContext(baseContext: LogContext = {}) {
  return {
    debug: (message: string, context: LogContext = {}) => emit("debug", message, { ...baseContext, ...context }),
    info: (message: string, context: LogContext = {}) => emit("info", message, { ...baseContext, ...context }),
    warn: (message: string, context: LogContext = {}) => emit("warn", message, { ...baseContext, ...context }),
    error: (message: string, context: LogContext = {}) => emit("error", message, { ...baseContext, ...context }),
    child: (context: LogContext) => withContext({ ...baseContext, ...context }),
  };
}

export const logger = withContext();

export function loggerForRequest(request: Request, context: LogContext = {}) {
  return logger.child({
    requestId: getRequestId(request),
    path: getPathname(request),
    method: request.method,
    ...context,
  });
}
