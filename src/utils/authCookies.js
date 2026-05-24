import crypto from "crypto";
import { env } from "../config/env.js";

export const ACCESS_COOKIE_NAME = "ps_access";
export const REFRESH_COOKIE_NAME = "ps_refresh";

const isHttpsRequest = (req) => {
  const forwardedProto = `${req.headers["x-forwarded-proto"] || ""}`.split(",")[0].trim();
  return req.secure || forwardedProto === "https";
};

const buildCookieOptions = (req, maxAgeMs) => {
  const useSecureCookies = env.cookieSecure && isHttpsRequest(req);
  return {
  httpOnly: true,
  secure: useSecureCookies,
  sameSite: useSecureCookies ? "none" : "lax",
  path: "/",
  maxAge: maxAgeMs,
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  };
};

export const setAuthCookies = (req, res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, buildCookieOptions(req, 15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildCookieOptions(req, 30 * 24 * 60 * 60 * 1000));
};

export const clearAuthCookies = (req, res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, buildCookieOptions(req, 0));
  res.clearCookie(REFRESH_COOKIE_NAME, buildCookieOptions(req, 0));
};

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
