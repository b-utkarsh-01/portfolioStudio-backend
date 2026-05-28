import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465, // true for 465, false for 587
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: env.emailFrom,
    to: toEmail,
    subject: "Password Reset Request - Portfolio Studio",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f97316; text-align: center;">Portfolio Studio</h2>
        <p>Hi,</p>
        <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #475569;">${resetLink}</p>
        <p style="margin-top: 30px; font-size: 0.875rem; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
