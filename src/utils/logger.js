const toErrorObject = (error) => {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.code ? { code: error.code } : {}),
    };
  }
  return { message: String(error) };
};

const baseLog = (level, message, meta) => {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? meta : {}),
  };

  // Keep logs JSON for production parsers.
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
};

export const logger = {
  info: (message, meta) => baseLog("info", message, meta),
  warn: (message, meta) => baseLog("warn", message, meta),
  error: (message, meta) => baseLog("error", message, meta),
};

export const logRequestError = (error, req, meta = {}) => {
  logger.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.user?._id?.toString?.(),
    error: toErrorObject(error),
    ...meta,
  });
};

