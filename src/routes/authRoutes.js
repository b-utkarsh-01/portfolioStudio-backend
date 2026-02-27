import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import { authMiddleware } from "../middleware/auth.js";
import { signToken } from "../utils/token.js";
import { defaultPortfolioData } from "../seed/defaultPortfolioData.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const username = `${req.body.username || ""}`.trim().toLowerCase();
    const displayName = `${req.body.displayName || username}`.trim();
    const password = `${req.body.password || ""}`;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      displayName: displayName || username,
      passwordHash,
    });

    await Portfolio.create({
      user: user._id,
      username: user.username,
      templateId: "portfolio-v1",
      data: defaultPortfolioData,
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch {
    return res.status(500).json({ message: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const username = `${req.body.username || ""}`.trim().toLowerCase();
    const password = `${req.body.password || ""}`;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch {
    return res.status(500).json({ message: "Login failed." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    user: {
      username: req.user.username,
      displayName: req.user.displayName,
    },
  });
});

export default router;
