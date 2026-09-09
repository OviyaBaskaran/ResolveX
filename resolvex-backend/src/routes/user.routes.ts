import { Router } from "express";
import { createUser, listUsers, updateUserRole, updateUserStatus } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRole("ORGANIZATION_ADMIN"), createUser);
router.get("/", requireAuth, requireRole("ORGANIZATION_ADMIN"), listUsers);
router.patch("/:userId/status", requireAuth, requireRole("ORGANIZATION_ADMIN"), updateUserStatus);
router.patch("/:userId/role", requireAuth, requireRole("ORGANIZATION_ADMIN"), updateUserRole);

export default router;