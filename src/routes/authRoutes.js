import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Portfolio from "../models/Portfolio.js";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/token.js";
import { defaultPortfolioData } from "../seed/defaultPortfolioData.js";
import { sendError } from "../middleware/errors.js";
import { REFRESH_COOKIE_NAME, clearAuthCookies, hashToken, setAuthCookies } from "../utils/authCookies.js";
import { parseCookies } from "../utils/cookies.js";

const router = express.Router();

const toLinesArray = (value) =>
  `${value ?? ""}`
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildRegisterPortfolioData = (input) => {
  const base = JSON.parse(JSON.stringify(defaultPortfolioData));
  const profileName = `${input.displayName || input.username || ""}`.trim() || "Your Name";
  const initials = profileName
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const email = `${input.email || ""}`.trim();
  const phone = `${input.phone || ""}`.trim();
  const github = `${input.github || ""}`.trim();
  const githubHref = `${input.githubHref || ""}`.trim() || (github ? `https://${github.replace(/^https?:\/\//i, "")}` : "");

  base.profile.name = profileName;
  base.profile.title = toLinesArray(input.titles).slice(0, 8);
  base.profile.summary = `${input.summary || ""}`.trim() || base.profile.summary;
  base.profile.contacts = [
    phone ? { type: "phone", text: phone, href: phone.startsWith("tel:") ? phone : `tel:${phone.replace(/\s+/g, "")}` } : null,
    email ? { type: "email", text: email, href: email.startsWith("mailto:") ? email : `mailto:${email}` } : null,
    github
      ? {
          type: "github",
          text: github,
          href: githubHref,
          external: true,
        }
      : null,
  ].filter(Boolean);
  base.badgeName = {
    name: profileName,
    logo: initials || base.badgeName.logo,
    badgeTitle: `${input.badgeTitle || ""}`.trim() || base.badgeName.badgeTitle,
  };

  return base;
};

const issueSession = async (req, res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          tokenHash,
          expiresAt: refreshExpiresAt,
          userAgent: `${req.headers["user-agent"] || ""}`.slice(0, 300),
          ip: `${req.ip || ""}`.slice(0, 120),
        },
      },
    }
  );

  setAuthCookies(res, { accessToken, refreshToken });
};

router.post("/register", async (req, res) => {
  try {
    const username = `${req.body.username || ""}`.trim().toLowerCase();
    const displayName = `${req.body.displayName || username}`.trim();
    const password = `${req.body.password || ""}`;
    const email = `${req.body.email || ""}`.trim();

    if (!username || !password) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Username and password are required.",
      });
    }
    if (!email) {
      return sendError(res, req, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Contact email is required.",
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return sendError(res, req, {
        status: 409,
        code: "USERNAME_EXISTS",
        message: "Username already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      displayName: displayName || username,
      passwordHash,
    });

    await Portfolio.create({
      user: user._id,
      username: user.username,
      templateId: "premium-v1",
      data: buildRegisterPortfolioData({
        username,
        displayName: displayName || username,
        email,
        phone: req.body.phone,
        github: req.body.github,
        githubHref: req.body.githubHref,
        titles: req.body.titles,
        summary: req.body.summary,
        badgeTitle: req.body.badgeTitle,
      }),
    });

    await issueSession(req, res, user);
    return res.status(201).json({
      user: {
        username: user.username,
        displayName: user.displayName,
        hasPremiumAccess: Boolean(user.hasPremiumAccess),
      },
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "REGISTRATION_FAILED",
      message: "Registration failed.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
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
      user: {
        username: user.username,
        displayName: user.displayName,
        hasPremiumAccess: Boolean(user.hasPremiumAccess),
      },
    });
  } catch {
    return sendError(res, req, {
      status: 500,
      code: "LOGIN_FAILED",
      message: "Login failed.",
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const refreshToken = cookies[REFRESH_COOKIE_NAME] || "";
    if (!refreshToken) {
      return sendError(res, req, { status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (decoded?.type !== "refresh") {
      return sendError(res, req, { status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tokenHash = hashToken(refreshToken);
    const user = await User.findById(decoded.sub).select("_id username displayName refreshTokens");
    const validToken = user?.refreshTokens?.find(
      (entry) => entry.tokenHash === tokenHash && new Date(entry.expiresAt).getTime() > Date.now()
    );
    if (!user || !validToken) {
      clearAuthCookies(res);
      return sendError(res, req, { status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: { tokenHash } } });
    await issueSession(req, res, user);
    return res.json({
      user: {
        username: user.username,
        displayName: user.displayName,
        hasPremiumAccess: Boolean(user.hasPremiumAccess),
      },
    });
  } catch {
    clearAuthCookies(res);
    return sendError(res, req, { status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const refreshToken = cookies[REFRESH_COOKIE_NAME] || "";
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);
      await User.updateOne({ _id: decoded.sub }, { $pull: { refreshTokens: { tokenHash } } });
    }
  } finally {
    clearAuthCookies(res);
  }
  return res.json({ ok: true });
});

router.get("/me", authMiddleware, async (req, res) => {
  return res.json({
    user: {
      username: req.user.username,
      displayName: req.user.displayName,
      hasPremiumAccess: Boolean(req.user.hasPremiumAccess),
    },
  });
});

export default router;
