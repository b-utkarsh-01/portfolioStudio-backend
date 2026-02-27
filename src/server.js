import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectToDatabase } from "./db/connect.js";
import authRoutes from "./routes/authRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/portfolios", portfolioRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
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
