import express from "express";
import Portfolio from "../models/Portfolio.js";
import { authMiddleware } from "../middleware/auth.js";
import { validatePortfolioPayload } from "../utils/portfolioValidation.js";
import { sendError } from "../middleware/errors.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const portfolio =
      (await Portfolio.findOne({ user: req.user._id }).lean()) ||
      (await Portfolio.findOne({ username: req.user.username }).lean());
    if (!portfolio) {
      return res.json({ portfolio: null });
    }

    return res.json({
      portfolio: {
        templateId: portfolio.templateId,
        data: portfolio.data,
        username: portfolio.username,
      },
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_FETCH_FAILED",
      message: "Failed to fetch portfolio.",
    });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const validation = validatePortfolioPayload(req.body);
    if (!validation.ok) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid portfolio payload.",
        details: validation.errors,
      });
    }

    const { templateId, data } = validation.value;

    const updated = await Portfolio.findOneAndUpdate(
      {
        $or: [{ user: req.user._id }, { username: req.user.username }],
      },
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
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_SAVE_FAILED",
      message: "Failed to save portfolio.",
    });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const username = `${req.params.username || ""}`.trim().toLowerCase();
    const portfolio = await Portfolio.findOne({ username }).lean();
    if (!portfolio) {
      return sendError(res, req, {
        status: 404,
        code: "PORTFOLIO_NOT_FOUND",
        message: "Portfolio not found.",
      });
    }
    return res.json({
      portfolio: {
        username: portfolio.username,
        templateId: portfolio.templateId,
        data: portfolio.data,
      },
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_FETCH_FAILED",
      message: "Failed to fetch portfolio.",
    });
  }
});

export default router;
