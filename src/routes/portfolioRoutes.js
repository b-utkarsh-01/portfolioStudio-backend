import express from "express";
import Portfolio from "../models/Portfolio.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id }).lean();
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found." });
    }

    return res.json({
      portfolio: {
        templateId: portfolio.templateId,
        data: portfolio.data,
        username: portfolio.username,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch portfolio." });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const templateId = `${req.body.templateId || "portfolio-v1"}`.trim();
    const data = req.body.data || {};

    const updated = await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        username: req.user.username,
        templateId,
        data,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({
      message: "Portfolio saved.",
      portfolio: {
        templateId: updated.templateId,
        data: updated.data,
        username: updated.username,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to save portfolio." });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const username = `${req.params.username || ""}`.trim().toLowerCase();
    const portfolio = await Portfolio.findOne({ username }).lean();
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found." });
    }
    return res.json({
      portfolio: {
        username: portfolio.username,
        templateId: portfolio.templateId,
        data: portfolio.data,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch portfolio." });
  }
});

export default router;
