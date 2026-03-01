import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { saveFcmToken } from "../controllers/user.controller.js";

const router = Router();

router.post("/fcm-token", protect, saveFcmToken);

export default router;