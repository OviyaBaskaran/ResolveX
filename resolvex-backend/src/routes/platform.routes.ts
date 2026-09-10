import { Router } from "express";
import { listOrganizations, platformLogin, updateOrganizationStatus } from "../controllers/platform.controller.js";
import { requirePlatformAdmin } from "../middlewares/platform-auth.middleware.js";

const router = Router();

router.post("/auth/login", platformLogin);
router.get("/organizations", requirePlatformAdmin, listOrganizations);
router.patch("/organizations/:organizationId/status", requirePlatformAdmin, updateOrganizationStatus);

export default router;
