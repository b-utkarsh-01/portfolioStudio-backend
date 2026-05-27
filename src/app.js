import express from "express";
import cors from "cors";
import crypto from "crypto";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { sendError } from "./middleware/errors.js";

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  app.use(securityHeaders);
  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
  });
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (req, res) => {
    res.send("PortfolioStudio Backend is running.");
  });

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }), authRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/portfolios", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), portfolioRoutes);
  // Backward-compatible singular route alias.
  app.use("/api/portfolio", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), portfolioRoutes);
  app.use("/api/templates", templateRoutes);

  app.use((req, res) => {
    return sendError(res, req, {
      status: 404,
      code: "NOT_FOUND",
      message: "Route not found",
    });
  });

  return app;
};
