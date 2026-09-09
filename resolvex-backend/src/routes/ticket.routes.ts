import { Router } from "express";
import { createComment, listComments } from "../controllers/ticket-comment.controller.js";
import { createInternalNote, listInternalNotes } from "../controllers/ticket-internal-note.controller.js";
import { assign, create, get, list, status } from "../controllers/ticket.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import ticketAttachmentRoutes from "./ticket-attachment.routes.js";

const router = Router();

router.post("/", requireAuth, create);
router.get("/", requireAuth, list);
router.get("/:ticketId", requireAuth, get);
router.get("/:ticketId/comments", requireAuth, listComments);
router.post("/:ticketId/comments", requireAuth, createComment);
router.get("/:ticketId/internal-notes", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), listInternalNotes);
router.post("/:ticketId/internal-notes", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), createInternalNote);
router.use("/:ticketId/attachments", ticketAttachmentRoutes);
router.patch("/:ticketId/status", requireAuth, requireRole("SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"), status);
router.patch("/:ticketId/assignment", requireAuth, requireRole("MANAGER", "ORGANIZATION_ADMIN"), assign);

export default router;