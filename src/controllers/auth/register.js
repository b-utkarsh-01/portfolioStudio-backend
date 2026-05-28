import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Portfolio from "../../models/Portfolio.js";
import { sendError } from "../../middleware/errors.js";
import { logger } from "../../utils/logger.js";
import { buildRegisterPortfolioData, issueSession, toPublicUser } from "./authHelpers.js";

export const register = async (req, res) => {
  const username = `${req.body?.username || ""}`.trim().toLowerCase();
  const displayName = `${req.body?.displayName || username}`.trim();
  const password = `${req.body?.password || ""}`;
  const email = `${req.body?.email || ""}`.trim().toLowerCase();

  if (!username || !password) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Username and password are required.",
    });
  }
  if (username.length < 3 || username.length > 30 || !/^[a-z0-9._-]+$/i.test(username)) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Username must be 3–30 characters and contain only letters, numbers, ., _, -",
    });
  }
  if (!email) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Contact email is required.",
    });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid email address.",
    });
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] }).select("_id username email");
  if (existing?.username === username) {
    return sendError(res, req, {
      status: 409,
      code: "USERNAME_EXISTS",
      message: "Username already exists.",
    });
  }
  if (existing?.email === email) {
    return sendError(res, req, {
      status: 409,
      code: "EMAIL_EXISTS",
      message: "Email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      user = await User.create(
        [
          {
            username,
            email,
            displayName: displayName || username,
            passwordHash,
          },
        ],
        { session }
      ).then((docs) => docs[0]);

      await Portfolio.create(
        [
          {
            user: user._id,
            username: user.username,
            templateId: "premium-v1",
            data: buildRegisterPortfolioData({
              username,
              displayName: displayName || username,
              email,
              phone: req.body?.phone,
              github: req.body?.github,
              githubHref: req.body?.githubHref,
              titles: req.body?.titles,
              summary: req.body?.summary,
              badgeTitle: req.body?.badgeTitle,
            }),
          },
        ],
        { session }
      );
    });
  } catch (error) {
    logger.error("register_failed", { requestId: req.requestId, username, email, error: { message: error.message, code: error.code } });
    throw error;
  } finally {
    session.endSession();
  }

  await issueSession(req, res, user);
  return res.status(201).json({ user: toPublicUser(user) });
};
