import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as historyController from "../controllers/history/index.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(historyController.listHistory));
router.post("/manual", asyncHandler(historyController.createManualSnapshot));
router.put("/retention", asyncHandler(historyController.updateRetention));
router.delete("/", asyncHandler(historyController.clearAllHistory));

router.get("/:id", asyncHandler(historyController.getHistorySnapshot));
router.post("/:id/rollback", asyncHandler(historyController.rollbackSnapshot));
router.delete("/:id", asyncHandler(historyController.deleteSnapshot));

export default router;
