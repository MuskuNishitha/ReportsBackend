import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createReport,
  listReports,
  getReport,
  updateReport,
  updateStatus
} from "../controllers/report.controller.js";

const router = Router();

router.post("/", protect, createReport);
router.get("/", protect, listReports);
router.get("/:id", protect, getReport);
router.patch("/:id", protect, updateReport);
router.patch("/:id/status", protect, updateStatus);

export default router;