import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { RESERVED_SLUGS, normalizeSlug } from "./portfolioHelpers.js";

export const checkSlugAvailability = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    if (!slug || slug.length < 3) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Slug must be at least 3 characters.",
      });
    }
    if (RESERVED_SLUGS.has(slug)) return res.json({ available: false, reason: "reserved" });

    const existing = await Portfolio.findOne({ slug }).select("_id user").lean();
    if (!existing || `${existing.user}` === `${req.user._id}`) return res.json({ available: true });
    return res.json({ available: false, reason: "taken" });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "SLUG_CHECK_FAILED",
      message: "Failed to check slug availability.",
    });
  }
};
