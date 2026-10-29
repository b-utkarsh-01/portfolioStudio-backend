import Portfolio from "../../models/Portfolio.js";
import PortfolioHistory from "../../models/PortfolioHistory.js";
import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";
import { calculateExpiresAt, enforceHistoryLimit } from "../../utils/historyHelpers.js";
import { toPortfolioResponse } from "../portfolio/portfolioHelpers.js";

/**
 * GET /api/history
 * List snapshots for the logged-in user.
 */
export const listHistory = async (req, res) => {
  const userId = req.user._id;

  const [snapshots, user] = await Promise.all([
    PortfolioHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("_id version name type templateId changeSummary expiresAt createdAt")
      .lean(),
    User.findById(userId).select("historyRetentionDays").lean(),
  ]);

  return res.json({
    retentionDays: user?.historyRetentionDays ?? 7,
    total: snapshots.length,
    snapshots,
  });
};

/**
 * GET /api/history/:id
 * Get full snapshot details including portfolio data for preview.
 */
export const getHistorySnapshot = async (req, res) => {
  const { id } = req.params;
  const snapshot = await PortfolioHistory.findOne({ _id: id, user: req.user._id }).lean();

  if (!snapshot) {
    return sendError(res, req, {
      status: 404,
      code: "SNAPSHOT_NOT_FOUND",
      message: "Version snapshot not found.",
    });
  }

  return res.json({ snapshot });
};

/**
 * POST /api/history/manual
 * Create a named manual snapshot of current portfolio.
 */
export const createManualSnapshot = async (req, res) => {
  const userId = req.user._id;
  const name = `${req.body?.name || ""}`.trim() || "Manual Backup";

  const portfolio =
    (await Portfolio.findOne({ user: userId }).lean()) ||
    (await Portfolio.findOne({ username: req.user.username }).lean());

  if (!portfolio) {
    return sendError(res, req, {
      status: 400,
      code: "PORTFOLIO_EMPTY",
      message: "No active portfolio found to snapshot.",
    });
  }

  const [lastSnapshot, user] = await Promise.all([
    PortfolioHistory.findOne({ user: userId }).sort({ version: -1 }).select("version").lean(),
    User.findById(userId).select("historyRetentionDays").lean(),
  ]);

  const nextVersion = (lastSnapshot?.version || 0) + 1;
  const retentionDays = user?.historyRetentionDays ?? 7;
  const expiresAt = calculateExpiresAt(retentionDays);

  const newSnapshot = await PortfolioHistory.create({
    user: userId,
    portfolio: portfolio._id,
    version: nextVersion,
    name,
    type: "manual",
    templateId: portfolio.templateId || "premium-v1",
    data: portfolio.data || {},
    changeSummary: ["Manual Snapshot"],
    expiresAt,
  });

  await enforceHistoryLimit(userId);

  return res.status(201).json({
    message: "Snapshot created successfully.",
    snapshot: {
      _id: newSnapshot._id,
      version: newSnapshot.version,
      name: newSnapshot.name,
      type: newSnapshot.type,
      templateId: newSnapshot.templateId,
      changeSummary: newSnapshot.changeSummary,
      expiresAt: newSnapshot.expiresAt,
      createdAt: newSnapshot.createdAt,
    },
  });
};

/**
 * POST /api/history/:id/rollback
 * Restore portfolio to the chosen snapshot version.
 */
export const rollbackSnapshot = async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const targetSnapshot = await PortfolioHistory.findOne({ _id: id, user: userId }).lean();
  if (!targetSnapshot) {
    return sendError(res, req, {
      status: 404,
      code: "SNAPSHOT_NOT_FOUND",
      message: "Snapshot to restore was not found.",
    });
  }

  // Get current active portfolio to back it up before overwriting
  const currentPortfolio =
    (await Portfolio.findOne({ user: userId }).lean()) ||
    (await Portfolio.findOne({ username: req.user.username }).lean());

  if (currentPortfolio) {
    const [lastSnapshot, user] = await Promise.all([
      PortfolioHistory.findOne({ user: userId }).sort({ version: -1 }).select("version").lean(),
      User.findById(userId).select("historyRetentionDays").lean(),
    ]);

    const backupVersion = (lastSnapshot?.version || 0) + 1;
    const retentionDays = user?.historyRetentionDays ?? 7;

    await PortfolioHistory.create({
      user: userId,
      portfolio: currentPortfolio._id,
      version: backupVersion,
      name: `Pre-Rollback Backup (before v${targetSnapshot.version})`,
      type: "pre-rollback",
      templateId: currentPortfolio.templateId,
      data: currentPortfolio.data,
      changeSummary: ["Auto Backup before Rollback"],
      expiresAt: calculateExpiresAt(retentionDays),
    });
  }

  // Restore the portfolio data from targetSnapshot
  const restored = await Portfolio.findOneAndUpdate(
    { $or: [{ user: userId }, { username: req.user.username }] },
    {
      $set: {
        templateId: targetSnapshot.templateId,
        data: targetSnapshot.data,
      },
    },
    { new: true }
  ).lean();

  await enforceHistoryLimit(userId);

  return res.json({
    message: `Restored portfolio to version ${targetSnapshot.version} (${targetSnapshot.name}).`,
    portfolio: toPortfolioResponse(restored),
    restoredVersion: targetSnapshot.version,
  });
};

/**
 * DELETE /api/history/:id
 * Delete a specific snapshot.
 */
export const deleteSnapshot = async (req, res) => {
  const { id } = req.params;
  const deleted = await PortfolioHistory.findOneAndDelete({ _id: id, user: req.user._id });

  if (!deleted) {
    return sendError(res, req, {
      status: 404,
      code: "SNAPSHOT_NOT_FOUND",
      message: "Snapshot not found or already deleted.",
    });
  }

  return res.json({ message: "Snapshot deleted." });
};

/**
 * DELETE /api/history
 * Clear all history snapshots for user.
 */
export const clearAllHistory = async (req, res) => {
  const userId = req.user._id;
  const result = await PortfolioHistory.deleteMany({ user: userId });

  return res.json({
    message: "All history snapshots cleared successfully.",
    deletedCount: result.deletedCount,
  });
};

/**
 * PUT /api/history/retention
 * Update retention days preference (0 = never, 2, 7, 30).
 */
export const updateRetention = async (req, res) => {
  const userId = req.user._id;
  const rawDays = Number(req.body?.days);

  // Allowed retention values: 0 (never), 2 days, 7 days, 30 days
  const validRetentionOptions = [0, 2, 7, 30];
  const days = validRetentionOptions.includes(rawDays) ? rawDays : 7;

  await User.updateOne({ _id: userId }, { $set: { historyRetentionDays: days } });

  // Update existing snapshots' expiresAt accordingly
  const newExpiresAt = calculateExpiresAt(days);
  await PortfolioHistory.updateMany({ user: userId }, { $set: { expiresAt: newExpiresAt } });

  return res.json({
    message: `Retention policy updated to ${days === 0 ? "Never delete" : `${days} days`}.`,
    retentionDays: days,
  });
};
