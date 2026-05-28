import express from "express";
import Portfolio from "../models/Portfolio.js";
import { authMiddleware } from "../middleware/auth.js";
import { validatePortfolioPayload } from "../utils/portfolioValidation.js";
import { sendError } from "../middleware/errors.js";
import { validateBody } from "../middleware/validate.js";
import { portfolioUpsertSchema } from "../validation/portfolioSchemas.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "login",
  "logout",
  "profile",
  "register",
  "settings",
  "templates",
  "u",
  "p",
]);

const normalizeSlug = (value) =>
  `${value || ""}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const isVisibility = (value) => ["public", "unlisted", "private"].includes(value);

const toPortfolioResponse = (portfolio) => ({
  templateId: portfolio.templateId,
  data: portfolio.data,
  username: portfolio.username,
  status: portfolio.status || "draft",
  visibility: portfolio.visibility || "private",
  slug: portfolio.slug || "",
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const portfolio =
      (await Portfolio.findOne({ user: req.user._id }).lean()) ||
      (await Portfolio.findOne({ username: req.user.username }).lean());
    if (!portfolio) {
      return res.json({ portfolio: null });
    }

    return res.json({ portfolio: toPortfolioResponse(portfolio) });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_FETCH_FAILED",
      message: "Failed to fetch portfolio.",
    });
  }
});

router.put(
  "/me",
  authMiddleware,
  validateBody(portfolioUpsertSchema),
  asyncHandler(async (req, res) => {
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
      { $or: [{ user: req.user._id }, { username: req.user.username }] },
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
      portfolio: toPortfolioResponse(updated),
    });
  })
);

router.get("/slug-availability/:slug", authMiddleware, async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    if (!slug || slug.length < 3) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Slug must be at least 3 characters.",
      });
    }
    if (RESERVED_SLUGS.has(slug)) return res.json({ available: false, reason: "reserved" });

    const existing = await Portfolio.findOne({ slug }).select("_id user").lean();
    if (!existing || `${existing.user}` === `${req.user._id}`) return res.json({ available: true });
    return res.json({ available: false, reason: "taken" });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "SLUG_CHECK_FAILED",
      message: "Failed to check slug availability.",
    });
  }
});

router.post("/me/publish", authMiddleware, async (req, res) => {
  try {
    const rawSlug = normalizeSlug(req.body?.slug || "");
    const visibility = `${req.body?.visibility || "public"}`.toLowerCase().trim();
    if (!isVisibility(visibility)) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "visibility must be one of: public, unlisted, private",
      });
    }

    const portfolio = await Portfolio.findOne({ $or: [{ user: req.user._id }, { username: req.user.username }] });
    if (!portfolio) {
      return sendError(res, req, {
        status: 404,
        code: "PORTFOLIO_NOT_FOUND",
        message: "Portfolio not found.",
      });
    }

    const resolvedSlug = rawSlug || portfolio.slug || normalizeSlug(portfolio.username);
    if (!resolvedSlug || resolvedSlug.length < 3) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Slug must be at least 3 characters.",
      });
    }
    if (RESERVED_SLUGS.has(resolvedSlug)) {
      return sendError(res, req, {
        status: 409,
        code: "SLUG_RESERVED",
        message: "This slug is reserved.",
      });
    }

    const collision = await Portfolio.findOne({ slug: resolvedSlug, _id: { $ne: portfolio._id } }).select("_id").lean();
    if (collision) {
      return sendError(res, req, {
        status: 409,
        code: "SLUG_TAKEN",
        message: "This slug is already taken.",
      });
    }

    portfolio.slug = resolvedSlug;
    portfolio.status = "published";
    portfolio.visibility = visibility;
    portfolio.publishedAt = portfolio.publishedAt || new Date();
    await portfolio.save();

    return res.json({
      message: "Portfolio published.",
      portfolio: toPortfolioResponse(portfolio.toObject()),
      publicUrl: `/p/${resolvedSlug}`,
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PUBLISH_FAILED",
      message: "Failed to publish portfolio.",
    });
  }
});

router.post("/me/unpublish", authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { $or: [{ user: req.user._id }, { username: req.user.username }] },
      { $set: { status: "draft", visibility: "private" } },
      { new: true }
    ).lean();

    if (!portfolio) {
      return sendError(res, req, {
        status: 404,
        code: "PORTFOLIO_NOT_FOUND",
        message: "Portfolio not found.",
      });
    }

    return res.json({
      message: "Portfolio unpublished.",
      portfolio: toPortfolioResponse(portfolio),
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "UNPUBLISH_FAILED",
      message: "Failed to unpublish portfolio.",
    });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    const portfolio = await Portfolio.findOne({ slug }).lean();
    if (!portfolio) {
      return sendError(res, req, {
        status: 404,
        code: "PORTFOLIO_NOT_FOUND",
        message: "Portfolio not found.",
      });
    }
    if (portfolio.visibility === "private" || portfolio.status !== "published") {
      return sendError(res, req, {
        status: 403,
        code: "PORTFOLIO_PRIVATE",
        message: "This portfolio is private.",
      });
    }
    return res.json({ portfolio: toPortfolioResponse(portfolio) });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_FETCH_FAILED",
      message: "Failed to fetch portfolio.",
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
    if (portfolio.visibility === "private" || portfolio.status !== "published") {
      return sendError(res, req, {
        status: 403,
        code: "PORTFOLIO_PRIVATE",
        message: "This portfolio is private.",
      });
    }
    return res.json({ portfolio: toPortfolioResponse(portfolio) });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "PORTFOLIO_FETCH_FAILED",
      message: "Failed to fetch portfolio.",
    });
  }
});

export default router;
