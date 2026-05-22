import crypto from "crypto";
import { env } from "../config/env.js";

export const ACCESS_COOKIE_NAME = "ps_access";
export const REFRESH_COOKIE_NAME = "ps_refresh";

const buildCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSecure ? "none" : "lax",
  path: "/",
  maxAge: maxAgeMs,
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, buildCookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildCookieOptions(30 * 24 * 60 * 60 * 1000));
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, buildCookieOptions(0));
  res.clearCookie(REFRESH_COOKIE_NAME, buildCookieOptions(0));
};

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
