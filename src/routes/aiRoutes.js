import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendError } from "../middleware/errors.js";

const router = express.Router();

// Minimal production-safe scaffold: keep the route mounted so the frontend
// can reliably detect availability, while actual AI features iterate.
router.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({ ok: true });
  })
);

router.post(
  "/generate",
  asyncHandler(async (req, res) => {
    return sendError(res, req, {
      status: 501,
      code: "NOT_IMPLEMENTED",
      message: "AI generation is not configured on this server.",
    });
  })
);

export default router;

