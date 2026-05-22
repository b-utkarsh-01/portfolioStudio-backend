import dotenv from "dotenv";

dotenv.config();

const parsedCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const fallbackCorsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  cookieSecure:
    process.env.COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false"),
  cookieDomain: process.env.COOKIE_DOMAIN || "",
  corsOrigins: parsedCorsOrigins.length ? parsedCorsOrigins : [fallbackCorsOrigin],
};
