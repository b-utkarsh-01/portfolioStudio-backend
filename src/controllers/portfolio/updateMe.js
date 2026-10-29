import Portfolio from "../../models/Portfolio.js";
import PortfolioHistory from "../../models/PortfolioHistory.js";
import User from "../../models/User.js";
import { validatePortfolioPayload } from "../../utils/portfolioValidation.js";
import { sendError } from "../../middleware/errors.js";
import { toPortfolioResponse } from "./portfolioHelpers.js";
import { calculateExpiresAt, detectChangeSummary, enforceHistoryLimit } from "../../utils/historyHelpers.js";

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
  const userId = req.user._id;

  // Check existing portfolio to determine if changes should be snapshotted
  const existing = await Portfolio.findOne({
    $or: [{ user: userId }, { username: req.user.username }],
  }).lean();

  if (existing && existing.data && Object.keys(existing.data).length > 0) {
    const changes = detectChangeSummary(existing.data, data, existing.templateId, templateId);

    // If changes occurred, auto-snapshot the previous state before overwriting
    if (changes.length > 0) {
      try {
        const [lastSnapshot, user] = await Promise.all([
          PortfolioHistory.findOne({ user: userId }).sort({ version: -1 }).select("version").lean(),
          User.findById(userId).select("historyRetentionDays").lean(),
        ]);

        const nextVersion = (lastSnapshot?.version || 0) + 1;
        const retentionDays = user?.historyRetentionDays ?? 7;

        await PortfolioHistory.create({
          user: userId,
          portfolio: existing._id,
          version: nextVersion,
          name: `Auto-saved before: ${changes.slice(0, 2).join(", ")}`,
          type: "auto",
          templateId: existing.templateId || "premium-v1",
          data: existing.data,
          changeSummary: changes,
          expiresAt: calculateExpiresAt(retentionDays),
        });

        await enforceHistoryLimit(userId);
      } catch (err) {
        console.error("[AUTO SNAPSHOT ERROR]:", err.message);
      }
    }
  }

  const updated = await Portfolio.findOneAndUpdate(
    { $or: [{ user: userId }, { username: req.user.username }] },
    {
      user: userId,
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
