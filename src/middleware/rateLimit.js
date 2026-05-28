import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { sendError } from "./errors.js";

let redisClient = null;
let redisReady = false;
let redisInitAttempted = false;

const getRedisClient = () => {
  if (!env.redisUrl) return null;
  if (redisClient) return redisClient;
  if (redisInitAttempted) return null;
  redisInitAttempted = true;

  try {
    redisClient = new IORedis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });

    redisClient.on("ready", () => {
      redisReady = true;
      logger.info("redis_ready");
    });
    redisClient.on("error", (error) => {
      redisReady = false;
      logger.error("redis_error", { error: { message: error.message } });
    });

    // Non-blocking: connect in background.
    redisClient.connect().catch((error) => {
      redisReady = false;
      logger.error("redis_connect_failed", { error: { message: error.message } });
    });

    return redisClient;
  } catch (error) {
    logger.error("redis_init_failed", { error: { message: error.message } });
    redisClient = null;
    return null;
  }
};

const defaultKeyGenerator = (req) => {
  const forwardedFor = `${req.headers["x-forwarded-for"] || ""}`.split(",")[0].trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  name = "default",
  keyGenerator = defaultKeyGenerator,
} = {}) => {
  const client = getRedisClient();

  const store = client
    ? new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: `rl:${name}:`,
      })
    : undefined;

  if (!client && env.redisUrl) logger.warn("rate_limit_fallback_memory", { name });

  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: true, // keeps X-RateLimit-* headers for clients
    keyGenerator,
    store,
    skip: (req) => req.method === "OPTIONS",
    handler: (req, res) =>
      sendError(res, req, {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      }),
  });
};
