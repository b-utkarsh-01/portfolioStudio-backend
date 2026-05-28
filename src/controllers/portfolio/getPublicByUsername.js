import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { toPortfolioResponse } from "./portfolioHelpers.js";

export const getPublicByUsername = async (req, res) => {
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
};
