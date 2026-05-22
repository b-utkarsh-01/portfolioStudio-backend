import express from "express";
import cors from "cors";
import crypto from "crypto";
import { env } from "./config/env.js";
import { connectToDatabase } from "./db/connect.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { sendError } from "./middleware/errors.js";

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
app.use(securityHeaders);
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("PortfolioStudio Backend is Running 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }), authRoutes);
app.use("/api/portfolios", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 120 }), portfolioRoutes);
app.use("/api/templates", templateRoutes);

app.use((req, res) => {
  return sendError(res, req, {
    status: 404,
    code: "NOT_FOUND",
    message: "Route not found",
  });
});

const start = async () => {
  try {
    await connectToDatabase();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running at http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

start();
