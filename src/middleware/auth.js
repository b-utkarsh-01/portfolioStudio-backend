import User from "../models/User.js";
import { verifyAccessToken } from "../utils/token.js";
import { ACCESS_COOKIE_NAME } from "../utils/authCookies.js";
import { parseCookies } from "../utils/cookies.js";
import { sendError } from "./errors.js";

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
    const user = await User.findById(decoded.sub).select("_id username displayName hasPremiumAccess");
    if (!user) {
      return sendError(res, req, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

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
