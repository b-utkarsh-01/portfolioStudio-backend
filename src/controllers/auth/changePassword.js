import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";

export const changePassword = async (req, res) => {
  const currentPassword = `${req.body?.currentPassword || ""}`;
  const newPassword = `${req.body?.newPassword || ""}`;

  if (!currentPassword || !newPassword) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Both current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return sendError(res, req, {
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    });
  }

  const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    return sendError(res, req, {
      status: 400,
      code: "INVALID_CURRENT_PASSWORD",
      message: "Current password does not match.",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  return res.json({
    ok: true,
    message: "Password changed successfully.",
  });
};
