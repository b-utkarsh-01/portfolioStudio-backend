import PortfolioHistory from "../models/PortfolioHistory.js";

export const MAX_SNAPSHOTS_PER_USER = 25;

/**
 * Calculate expiresAt date based on retention days.
 * 0 means 'Never delete' (returns null, which TTL index ignores).
 */
export const calculateExpiresAt = (retentionDays = 7) => {
  const days = Number(retentionDays);
  if (!days || days <= 0) return null;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/**
 * Detect high-level changes between two portfolio data objects.
 */
export const detectChangeSummary = (prevData = {}, nextData = {}, prevTemplate = "", nextTemplate = "") => {
  const changes = [];

  if (prevTemplate && nextTemplate && prevTemplate !== nextTemplate) {
    changes.push("Template Style");
  }

  const prevProfile = prevData?.profile || {};
  const nextProfile = nextData?.profile || {};

  if (
    prevProfile.name !== nextProfile.name ||
    prevProfile.summary !== nextProfile.summary ||
    prevProfile.avatar !== nextProfile.avatar ||
    JSON.stringify(prevProfile.title || []) !== JSON.stringify(nextProfile.title || []) ||
    JSON.stringify(prevProfile.contacts || []) !== JSON.stringify(nextProfile.contacts || [])
  ) {
    changes.push("Profile & Bio");
  }

  if (JSON.stringify(prevData?.skills || {}) !== JSON.stringify(nextData?.skills || {})) {
    changes.push("Skills");
  }

  if (
    JSON.stringify(prevData?.experiences || []) !== JSON.stringify(nextData?.experiences || []) ||
    JSON.stringify(prevData?.projects || []) !== JSON.stringify(nextData?.projects || [])
  ) {
    changes.push("Work & Projects");
  }

  if (
    JSON.stringify(prevData?.services || []) !== JSON.stringify(nextData?.services || []) ||
    JSON.stringify(prevData?.testimonials || []) !== JSON.stringify(nextData?.testimonials || [])
  ) {
    changes.push("Services & Social");
  }

  if (JSON.stringify(prevData?.certifications || []) !== JSON.stringify(nextData?.certifications || [])) {
    changes.push("Certifications");
  }

  const prevCustom = prevData?.customStages || [];
  const nextCustom = nextData?.customStages || [];
  if (JSON.stringify(prevCustom) !== JSON.stringify(nextCustom)) {
    changes.push("Custom Stages");
  }

  return changes.length ? changes : ["Portfolio Details"];
};

/**
 * Enforce max snapshots cap per user to avoid database bloating.
 */
export const enforceHistoryLimit = async (userId) => {
  try {
    const totalCount = await PortfolioHistory.countDocuments({ user: userId });
    if (totalCount > MAX_SNAPSHOTS_PER_USER) {
      // Find oldest snapshots that are auto-saved first, or simply oldest
      const excessCount = totalCount - MAX_SNAPSHOTS_PER_USER;
      const oldestSnapshots = await PortfolioHistory.find({ user: userId })
        .sort({ createdAt: 1 })
        .limit(excessCount)
        .select("_id")
        .lean();

      if (oldestSnapshots.length) {
        const idsToDelete = oldestSnapshots.map((s) => s._id);
        await PortfolioHistory.deleteMany({ _id: { $in: idsToDelete } });
      }
    }
  } catch (error) {
    console.error("[HISTORY LIMIT ERROR]:", error.message);
  }
};
