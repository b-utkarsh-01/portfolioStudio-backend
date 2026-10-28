import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";

export const resetPassword = async (req, res) => {
  const token = `${req.body?.token || ""}`.trim();
  const newPassword = `${req.body?.password || ""}`;

  if (!token || !newPassword) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Token and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Password must be at least 6 characters.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("_id username");

  if (!user) {
    return sendError(res, req, {
      status: 400,
      code: "INVALID_OR_EXPIRED_TOKEN",
      message: "Password reset link is invalid or has expired.",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and revoke all existing sessions/refresh tokens for security
  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash, refreshTokens: [] },
      $unset: {
        passwordResetToken: "",
        passwordResetExpires: "",
      },
    }
  );

  return res.json({ message: "Password has been reset successfully. Please log in with your new password." });
};
