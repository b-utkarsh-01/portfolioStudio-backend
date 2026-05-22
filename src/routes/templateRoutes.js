import express from "express";
import { templateCatalog } from "../seed/templateCatalog.js";

const router = express.Router();

router.get("/", (req, res) =>
  res.json({
    templates: templateCatalog,
  })
);

export default router;
