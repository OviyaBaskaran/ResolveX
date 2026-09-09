import { Router } from "express";
import { completePasswordReset, forgotPassword, login, logout, refresh, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", completePasswordReset);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

export default router;