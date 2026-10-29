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
 * Detect exact, human-readable change details between two portfolio data objects.
 * Returns an array of specific change descriptions.
 */
export const detectChangeSummary = (prevData = {}, nextData = {}, prevTemplate = "", nextTemplate = "") => {
  const changes = [];

  // Template comparison
  if (prevTemplate && nextTemplate && prevTemplate !== nextTemplate) {
    changes.push(`Template changed: ${prevTemplate} → ${nextTemplate}`);
  }

  const prevProfile = prevData?.profile || {};
  const nextProfile = nextData?.profile || {};

  // Profile Name
  if (prevProfile.name !== nextProfile.name) {
    if (!prevProfile.name) {
      changes.push(`Name set to "${nextProfile.name || ""}"`);
    } else if (!nextProfile.name) {
      changes.push(`Name cleared`);
    } else {
      changes.push(`Name: "${prevProfile.name}" → "${nextProfile.name}"`);
    }
  }

  // Profile Avatar
  if (prevProfile.avatar !== nextProfile.avatar) {
    changes.push("Profile photo updated");
  }

  // Profile Titles
  const prevTitles = Array.isArray(prevProfile.title) ? prevProfile.title : [];
  const nextTitles = Array.isArray(nextProfile.title) ? nextProfile.title : [];
  if (JSON.stringify(prevTitles) !== JSON.stringify(nextTitles)) {
    if (nextTitles.length > prevTitles.length) {
      changes.push(`Job titles updated (${nextTitles.length} titles)`);
    } else {
      changes.push("Job titles modified");
    }
  }

  // Profile Summary / Bio
  if (prevProfile.summary !== nextProfile.summary) {
    changes.push("Bio & Summary text updated");
  }

  // Contacts / Socials
  const prevContacts = Array.isArray(prevProfile.contacts) ? prevProfile.contacts : [];
  const nextContacts = Array.isArray(nextProfile.contacts) ? nextProfile.contacts : [];
  if (JSON.stringify(prevContacts) !== JSON.stringify(nextContacts)) {
    changes.push(`Contacts & social links updated (${nextContacts.length} links)`);
  }

  // Skills
  const prevSkills = prevData?.skills || {};
  const nextSkills = nextData?.skills || {};
  if (JSON.stringify(prevSkills) !== JSON.stringify(nextSkills)) {
    const prevCount = (prevSkills.primarySkills?.length || 0) + (prevSkills.secondarySkills?.length || 0);
    const nextCount = (nextSkills.primarySkills?.length || 0) + (nextSkills.secondarySkills?.length || 0);
    changes.push(`Technical skills updated (${nextCount} skills)`);
  }

  // Projects
  const prevProjects = Array.isArray(prevData?.projects) ? prevData.projects : [];
  const nextProjects = Array.isArray(nextData?.projects) ? nextData.projects : [];
  if (JSON.stringify(prevProjects) !== JSON.stringify(nextProjects)) {
    if (nextProjects.length !== prevProjects.length) {
      changes.push(`Projects updated (${prevProjects.length} → ${nextProjects.length} projects)`);
    } else {
      changes.push("Projects details modified");
    }
  }

  // Experience
  const prevExp = Array.isArray(prevData?.experiences) ? prevData.experiences : [];
  const nextExp = Array.isArray(nextData?.experiences) ? nextData.experiences : [];
  if (JSON.stringify(prevExp) !== JSON.stringify(nextExp)) {
    changes.push(`Work experience updated (${nextExp.length} positions)`);
  }

  // Education
  const prevEdu = Array.isArray(prevData?.education) ? prevData.education : [];
  const nextEdu = Array.isArray(nextData?.education) ? nextData.education : [];
  if (JSON.stringify(prevEdu) !== JSON.stringify(nextEdu)) {
    changes.push("Education details updated");
  }

  // Services & Testimonials
  const prevServices = Array.isArray(prevData?.services) ? prevData.services : [];
  const nextServices = Array.isArray(nextData?.services) ? nextData.services : [];
  if (JSON.stringify(prevServices) !== JSON.stringify(nextServices)) {
    changes.push(`Services updated (${nextServices.length} offerings)`);
  }

  // Certifications
  const prevCerts = Array.isArray(prevData?.certifications) ? prevData.certifications : [];
  const nextCerts = Array.isArray(nextData?.certifications) ? nextData.certifications : [];
  if (JSON.stringify(prevCerts) !== JSON.stringify(nextCerts)) {
    changes.push("Certifications updated");
  }

  // Custom Stages
  const prevCustom = Array.isArray(prevData?.customStages) ? prevData.customStages : [];
  const nextCustom = Array.isArray(nextData?.customStages) ? nextData.customStages : [];
  if (JSON.stringify(prevCustom) !== JSON.stringify(nextCustom)) {
    changes.push(`Custom stages updated (${nextCustom.length} custom stages)`);
  }

  return changes.length ? changes : ["Portfolio details updated"];
};

/**
 * Enforce max snapshots cap per user to avoid database bloating.
 */
export const enforceHistoryLimit = async (userId) => {
  try {
    const totalCount = await PortfolioHistory.countDocuments({ user: userId });
    if (totalCount > MAX_SNAPSHOTS_PER_USER) {
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
