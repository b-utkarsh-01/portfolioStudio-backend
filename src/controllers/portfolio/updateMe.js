import Portfolio from "../../models/Portfolio.js";
import { validatePortfolioPayload } from "../../utils/portfolioValidation.js";
import { sendError } from "../../middleware/errors.js";
import { toPortfolioResponse } from "./portfolioHelpers.js";

export const updateMe = async (req, res) => {
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
};
