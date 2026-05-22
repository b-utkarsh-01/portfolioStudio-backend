const buckets = new Map();

const now = () => Date.now();

const defaultKeyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "unknown";

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  keyGenerator = defaultKeyGenerator,
} = {}) => {
  return (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const key = `${req.baseUrl || ""}:${req.path || ""}:${keyGenerator(req)}`;
    const current = buckets.get(key);
    const ts = now();

    if (!current || current.resetAt <= ts) {
      buckets.set(key, { count: 1, resetAt: ts + windowMs });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - 1));
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - ts) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        requestId: req.requestId,
      });
    }

    current.count += 1;
    buckets.set(key, current);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current.count));
    return next();
  };
};
