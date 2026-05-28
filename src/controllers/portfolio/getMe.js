import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { toPortfolioResponse } from "./portfolioHelpers.js";

export const getMe = async (req, res) => {
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
};
