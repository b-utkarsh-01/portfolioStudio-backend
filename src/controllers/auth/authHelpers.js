import { signAccessToken, signRefreshToken } from "../../utils/token.js";
import { defaultPortfolioData } from "../../seed/defaultPortfolioData.js";
import { sendError } from "../../middleware/errors.js";
import { hashToken, setAuthCookies } from "../../utils/authCookies.js";
import User from "../../models/User.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const toLinesArray = (value) =>
  `${value ?? ""}`
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export const buildRegisterPortfolioData = (input) => {
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

export const issueSession = async (req, res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);

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

  setAuthCookies(req, res, { accessToken, refreshToken });
};

export const toPublicUser = (user) => ({
  username: user.username,
  displayName: user.displayName,
  email: user.email,
  hasPremiumAccess: Boolean(user.hasPremiumAccess),
});

export const sendUnauthorized = (res, req) =>
  sendError(res, req, {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Unauthorized",
  });
