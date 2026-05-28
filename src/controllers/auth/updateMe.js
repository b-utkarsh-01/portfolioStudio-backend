import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";
import { toPublicUser } from "./authHelpers.js";

export const updateMe = async (req, res) => {
  const displayName = `${req.body?.displayName || ""}`.trim();
  if (!displayName) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Display name is required.",
    });
  }

  await User.updateOne({ _id: req.user._id }, { $set: { displayName } });
  const updatedUser = await User.findById(req.user._id).select("username displayName hasPremiumAccess");

  return res.json({
    user: toPublicUser(updatedUser || { ...req.user, displayName }),
  });
};
