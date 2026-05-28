import User from "../../models/User.js";
import { verifyRefreshToken } from "../../utils/token.js";
import { REFRESH_COOKIE_NAME, clearAuthCookies, hashToken } from "../../utils/authCookies.js";
import { parseCookies } from "../../utils/cookies.js";

export const logout = async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const refreshToken = cookies[REFRESH_COOKIE_NAME] || "";
  if (refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);
    await User.updateOne({ _id: decoded.sub }, { $pull: { refreshTokens: { tokenHash } } });
  }
  clearAuthCookies(req, res);
  return res.json({ ok: true });
};
