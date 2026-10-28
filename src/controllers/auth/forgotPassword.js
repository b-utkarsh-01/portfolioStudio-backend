import crypto from "crypto";
import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail } from "../../services/emailService.js";
import { logger } from "../../utils/logger.js";

export const forgotPassword = async (req, res) => {
  const email = `${req.body?.email || ""}`.trim().toLowerCase();
  if (!email) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Email is required.",
    });
  }

  const user = await User.findOne({ email }).select("_id username email");
  if (!user) {
    return sendError(res, req, {
      status: 404,
      code: "EMAIL_NOT_FOUND",
      message: "No account registered with this email.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expiresAt,
      },
    }
  );

  let frontendBase = env.frontendUrl || "https://portfolio-studio-frontend.vercel.app";
  try {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : "");
    if (origin && (origin.includes("localhost") || origin.includes("vercel.app"))) {
      frontendBase = origin;
    }
  } catch {
    // fallback to env.frontendUrl
  }

  const resetLink = `${frontendBase}/reset-password?token=${resetToken}`;

  const isEmailConfigured = Boolean(
    env.brevoApiKey ||
    (env.smtpUser &&
      env.smtpPass &&
      env.smtpUser !== "your_gmail_username@gmail.com")
  );

  if (isEmailConfigured) {
    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (error) {
      logger.error("send_reset_email_failed", { email: user.email, error: error.message });
      console.error("[EMAIL ERROR]:", error.message);
      return sendError(res, req, {
        status: 500,
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send reset email. Please try again later.",
      });
    }
  } else {
    logger.warn("email_not_configured", { email: user.email });
  }

  return res.json({
    message: "Password reset link has been sent to your email. Please check your inbox.",
  });
};
