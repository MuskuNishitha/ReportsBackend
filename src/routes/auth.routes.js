import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/login", login);

// Use only for initial setup (create sir + employee)
router.post("/register", register);

router.get("/me", protect, me);

export default router;