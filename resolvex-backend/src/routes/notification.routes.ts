import { Router } from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.get("/unread-count", requireAuth, getUnreadNotificationCount);
router.patch("/read-all", requireAuth, markAllNotificationsAsRead);
router.patch("/:notificationId/read", requireAuth, markNotificationAsRead);

export default router;
