import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { toPortfolioResponse } from "./portfolioHelpers.js";

export const unpublish = async (req, res) => {
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
};
