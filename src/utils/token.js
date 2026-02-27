import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (user) => {
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

export const verifyToken = (token) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }
  return jwt.verify(token, env.jwtSecret);
};
