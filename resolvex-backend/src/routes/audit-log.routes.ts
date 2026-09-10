import { Router } from "express";
import { getAuditLogs } from "../controllers/audit-log.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, requireRole("MANAGER", "ORGANIZATION_ADMIN"), getAuditLogs);

export default router;
