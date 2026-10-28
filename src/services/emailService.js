import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  if (!env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP credentials are not configured in environment variables.");
  }

  const isGmail =
    env.smtpHost?.includes("gmail") ||
    env.smtpUser?.includes("@gmail.com");

  // On cloud platforms (Render, AWS, etc.), port 587 STARTTLS is often throttled or blocked.
  // Port 465 SSL or nodemailer's built-in 'gmail' service is far more reliable and faster.
  const transportOptions = isGmail
    ? {
        service: "gmail",
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
        connectionTimeout: 10000, // 10s
        greetingTimeout: 10000,   // 10s
        socketTimeout: 15000,     // 15s
      }
    : {
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpPort === 465,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      };

  const transporter = nodemailer.createTransport(transportOptions);

  const mailOptions = {
    from: env.emailFrom,
    to: toEmail,
    subject: "Password Reset Request - Portfolio Studio",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #f97316; text-align: center; margin-bottom: 20px;">Portfolio Studio</h2>
        <p style="color: #334155; font-size: 15px;">Hello,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #f97316; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">If the button above does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #0284c7; font-size: 13px;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
