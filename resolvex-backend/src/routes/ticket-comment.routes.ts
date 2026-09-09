import { Router } from "express";
import { createComment, listComments } from "../controllers/ticket-comment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listComments);
router.post("/", requireAuth, createComment);

export default router;
