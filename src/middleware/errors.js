export const sendError = (res, req, { status = 500, code = "INTERNAL_ERROR", message, details }) =>
  res.status(status).json({
    code,
    message,
    ...(details ? { details } : {}),
    requestId: req.requestId,
  });
