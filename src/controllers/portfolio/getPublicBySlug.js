import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { normalizeSlug, toPortfolioResponse } from "./portfolioHelpers.js";

export const getPublicBySlug = async (req, res) => {
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
};
