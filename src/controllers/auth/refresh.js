import User from "../../models/User.js";
import { verifyRefreshToken } from "../../utils/token.js";
import { REFRESH_COOKIE_NAME, clearAuthCookies, hashToken } from "../../utils/authCookies.js";
import { parseCookies } from "../../utils/cookies.js";
import { issueSession, sendUnauthorized, toPublicUser } from "./authHelpers.js";

export const refresh = async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const refreshToken = cookies[REFRESH_COOKIE_NAME] || "";
  if (!refreshToken) {
    return sendUnauthorized(res, req);
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (decoded?.type !== "refresh") {
    return sendUnauthorized(res, req);
  }

  const tokenHash = hashToken(refreshToken);
  const user = await User.findById(decoded.sub).select("_id username displayName refreshTokens");
  const validToken = user?.refreshTokens?.find(
    (entry) => entry.tokenHash === tokenHash && new Date(entry.expiresAt).getTime() > Date.now()
  );
  if (!user || !validToken) {
    clearAuthCookies(req, res);
    return sendUnauthorized(res, req);
  }

  await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: { tokenHash } } });
  await issueSession(req, res, user);
  return res.json({
    user: toPublicUser(user),
  });
};
