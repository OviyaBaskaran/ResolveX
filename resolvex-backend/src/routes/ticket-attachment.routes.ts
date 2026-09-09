import { Router } from "express";
import multer from "multer";
import { createAttachment, listAttachments } from "../controllers/ticket-attachment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

const router = Router({ mergeParams: true });

router.get("/", requireAuth, listAttachments);
router.post("/", requireAuth, upload.single("file"), createAttachment);

export default router;
