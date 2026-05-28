import { toPublicUser } from "./authHelpers.js";

export const getMe = async (req, res) => {
  return res.json({
    user: toPublicUser(req.user),
  });
};
