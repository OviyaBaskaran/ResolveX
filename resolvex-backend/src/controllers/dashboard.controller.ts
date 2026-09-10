import type { Request, Response } from "express";
import { getDashboardSummary, getTicketReport } from "../services/dashboard.service.js";
import { dashboardQuerySchema } from "../validations/dashboard.validation.js";

const parseQuery = (req: Request, res: Response) => {
  const result = dashboardQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: result.error.flatten().fieldErrors
    });
    return undefined;
  }
  return result.data;
};

export const getSummary = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  const query = parseQuery(req, res);
  if (!query) return;
  try {
    const data = await getDashboardSummary(req.user.organizationId, query);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getTicketsReport = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  const query = parseQuery(req, res);
  if (!query) return;
  try {
    const tickets = await getTicketReport(req.user.organizationId, query);
    res.status(200).json({ success: true, data: { tickets, filters: query } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
