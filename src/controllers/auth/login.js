import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { sendError } from "../../middleware/errors.js";
import { issueSession, toPublicUser } from "./authHelpers.js";

export const login = async (req, res) => {
  const username = `${req.body.username || ""}`.trim().toLowerCase();
  const password = `${req.body.password || ""}`;

  if (!username || !password) {
    return sendError(res, req, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Username and password are required.",
    });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return sendError(res, req, {
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password.",
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return sendError(res, req, {
      status: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid username or password.",
    });
  }

  await issueSession(req, res, user);
  return res.json({
    user: toPublicUser(user),
  });
};
