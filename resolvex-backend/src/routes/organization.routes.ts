import { Router } from "express";
import { getCurrentOrganization, updateCurrentOrganization } from "../controllers/organization.controller.js";
import { register } from "../controllers/organization-registration.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.get("/me", requireAuth, getCurrentOrganization);
router.patch("/me", requireAuth, requireRole("ORGANIZATION_ADMIN"), updateCurrentOrganization);

export default router;