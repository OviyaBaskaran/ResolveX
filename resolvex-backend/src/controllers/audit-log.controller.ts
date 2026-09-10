import type { Request, Response } from "express";
import { listAuditLogs } from "../services/audit-log.service.js";

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const logs = await listAuditLogs(req.user.organizationId);
    res.status(200).json({ success: true, data: { logs } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
