import { sendError } from "./errors.js";
import { logRequestError } from "../utils/logger.js";

const isMongoDuplicateKeyError = (error) => error?.code === 11000;

const toDuplicateKeyDetails = (error) => {
  const keyValue = error?.keyValue && typeof error.keyValue === "object" ? error.keyValue : null;
  const keys = keyValue ? Object.keys(keyValue) : [];
  return { keys, keyValue };
};

export const errorHandler = (err, req, res, next) => {
  // Express error handler signature requires `next`.
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  if (!err) {
    return sendError(res, req, {
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error.",
    });
  }

  // Log everything once, but do not leak stack traces to clients.
  logRequestError(err, req);

  if (isMongoDuplicateKeyError(err)) {
    const details = toDuplicateKeyDetails(err);
    let message = "A record with the same value already exists.";

    if (details.keys.includes("username")) {
      message = "Username already exists.";
    } else if (details.keys.includes("email")) {
      message = "Email already exists.";
    } else if (details.keys.includes("slug")) {
      message = "Slug already exists.";
    } else if (details.keys.includes("user")) {
      message = "User already has a portfolio.";
    } else if (details.keys.length > 0) {
      const keyName = details.keys[0];
      message = `${keyName.charAt(0).toUpperCase() + keyName.slice(1)} already exists.`;
    }

    return sendError(res, req, {
      status: 409,
      code: "DUPLICATE_KEY",
      message,
      details,
    });
  }

  const status = Number(err.status) || 500;
  const code = err.code || (status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR");
  const message =
    status >= 500 ? "Internal server error." : err.message || "Request failed.";

  return sendError(res, req, { status, code, message, details: err.details });
};

