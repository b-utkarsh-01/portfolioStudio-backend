import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

export const signRefreshToken = (user) => {
  if (!env.refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing in environment variables.");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      type: "refresh",
    },
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenExpiresIn }
  );
};

export const verifyAccessToken = (token) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }
  return jwt.verify(token, env.jwtSecret);
};

export const verifyRefreshToken = (token) => {
  if (!env.refreshTokenSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing in environment variables.");
  }
  return jwt.verify(token, env.refreshTokenSecret);
};
