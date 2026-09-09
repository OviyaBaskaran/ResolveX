import type { Request, Response } from "express";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notification.service.js";

const parseNotificationId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const notifications = await listNotifications(req.user.id, req.user.organizationId);
    res.status(200).json({ success: true, data: { notifications } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getUnreadNotificationCount = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const unreadCount = await countUnreadNotifications(req.user.id, req.user.organizationId);
    res.status(200).json({ success: true, data: { unreadCount } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const notificationId = parseNotificationId(req.params.notificationId);
  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    await markNotificationRead(notificationId, req.user.id, req.user.organizationId);
    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOTIFICATION_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Notification not found", code: "NOTIFICATION_NOT_FOUND" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const updatedCount = await markAllNotificationsRead(req.user.id, req.user.organizationId);
    res.status(200).json({ success: true, message: "Notifications marked as read", data: { updatedCount } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
