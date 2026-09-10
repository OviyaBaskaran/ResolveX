import { Router } from "express";
import { getSummary, getTicketsReport } from "../controllers/dashboard.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), getSummary);
router.get("/reports/tickets", requireAuth, requireRole("MANAGER", "ORGANIZATION_ADMIN"), getTicketsReport);

export default router;
