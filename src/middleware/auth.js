import User from "../models/User.js";
import { verifyAccessToken } from "../utils/token.js";
import { ACCESS_COOKIE_NAME } from "../utils/authCookies.js";
import { parseCookies } from "../utils/cookies.js";
import { sendError } from "./errors.js";
import { LRUCache } from "lru-cache";

const userCacheTtlMs = Number(process.env.AUTH_USER_CACHE_TTL_MS || 60_000);
const userCache =
  userCacheTtlMs > 0
    ? new LRUCache({
        max: 5000,
        ttl: userCacheTtlMs,
      })
    : null;

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    const cookies = parseCookies(req.headers.cookie || "");
    const cookieToken = cookies[ACCESS_COOKIE_NAME] || "";
    const accessToken = scheme === "Bearer" && token ? token : cookieToken;

    if (!accessToken) {
      return sendError(res, req, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const decoded = verifyAccessToken(accessToken);
    const cacheKey = decoded?.sub ? String(decoded.sub) : "";
    const cachedUser = userCache && cacheKey ? userCache.get(cacheKey) : null;
    const user =
      cachedUser ||
      (await User.findById(decoded.sub).select("_id username displayName hasPremiumAccess").lean());
    if (!user) {
      return sendError(res, req, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    if (userCache && cacheKey && !cachedUser) userCache.set(cacheKey, user);
    req.user = user;
    return next();
  } catch {
    return sendError(res, req, {
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
};
