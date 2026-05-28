import { sendError } from "./errors.js";

export const validateBody =
  (schema) =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }

    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request payload.",
      details,
    });
  };

