import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { portfolioUpsertSchema } from "../validation/portfolioSchemas.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as portfolioController from "../controllers/portfolioController.js";

const router = express.Router();

router.get("/me", authMiddleware, asyncHandler(portfolioController.getMe));
router.put("/me", authMiddleware, validateBody(portfolioUpsertSchema), asyncHandler(portfolioController.updateMe));
router.get("/slug-availability/:slug", authMiddleware, asyncHandler(portfolioController.checkSlugAvailability));
router.post("/me/publish", authMiddleware, asyncHandler(portfolioController.publish));
router.post("/me/unpublish", authMiddleware, asyncHandler(portfolioController.unpublish));
router.get("/public/:slug", asyncHandler(portfolioController.getPublicBySlug));
router.get("/:username", asyncHandler(portfolioController.getPublicByUsername));

export default router;
