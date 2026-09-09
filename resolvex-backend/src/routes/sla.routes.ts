import { Router } from "express";
import { createPolicy, getTicketSlaStatus, listPolicies, updatePolicy } from "../controllers/sla.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
const staffRoles = ["SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"] as const;

router.get("/policies", requireAuth, requireRole(...staffRoles), listPolicies);
router.post("/policies", requireAuth, requireRole("ORGANIZATION_ADMIN"), createPolicy);
router.patch("/policies/:policyId", requireAuth, requireRole("ORGANIZATION_ADMIN"), updatePolicy);
router.get("/tickets/:ticketId", requireAuth, getTicketSlaStatus);

export default router;
