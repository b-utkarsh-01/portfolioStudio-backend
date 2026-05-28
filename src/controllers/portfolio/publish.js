import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { RESERVED_SLUGS, isVisibility, normalizeSlug, toPortfolioResponse } from "./portfolioHelpers.js";

export const publish = async (req, res) => {
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
};
