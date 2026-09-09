import { Router } from "express";
import { createInternalNote, listInternalNotes } from "../controllers/ticket-internal-note.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), listInternalNotes);
router.post("/", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), createInternalNote);

export default router;
