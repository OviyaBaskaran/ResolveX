import type { Request, Response } from "express";
import { assignTicket, createTicket, getTicketById, listTickets, updateTicketStatus } from "../services/ticket.service.js";
import { assignTicketSchema, createTicketSchema, updateTicketStatusSchema } from "../validations/ticket.validation.js";
import { listTicketsQuerySchema } from "../validations/ticket-list.validation.js";

const paramId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);
const staffRoles = ["SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"];

export const create = async (req: Request, res: Response): Promise<void> => {
  const result = createTicketSchema.safeParse(req.body);
  if (!result.success || !req.user) {
    res.status(!req.user ? 401 : 400).json({ success: false, message: !req.user ? "Authentication required" : "Validation failed", code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  const ticket = await createTicket(result.data, req.user.organizationId, req.user.id);
  res.status(201).json({ success: true, message: "Ticket created", data: { ticket } });
};

export const list = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" }); return; }
  const result = listTicketsQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }
  const data = await listTickets(req.user.organizationId, req.user.id, req.user.roleCode, result.data);
  res.status(200).json({ success: true, data });
};

export const get = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) { res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" }); return; }
  const ticketId = paramId(req.params.ticketId);
  const ticket = await getTicketById(ticketId, req.user.organizationId, req.user.id, staffRoles.includes(req.user.roleCode));
  if (!ticket) { res.status(404).json({ success: false, message: "Ticket not found", code: "TICKET_NOT_FOUND" }); return; }
  res.status(200).json({ success: true, data: { ticket } });
};

export const status = async (req: Request, res: Response): Promise<void> => {
  const result = updateTicketStatusSchema.safeParse(req.body);
  const ticketId = paramId(req.params.ticketId);
  if (!result.success || !Number.isSafeInteger(ticketId) || !req.user) {
    res.status(!req.user ? 401 : 400).json({
      success: false,
      message: !req.user ? "Authentication required" : "Validation failed",
      code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR"
    });
    return;
  }
  try {
    await updateTicketStatus(ticketId, req.user.organizationId, req.user.id, req.user.roleCode, result.data.status);
    res.status(200).json({ success: true, message: "Ticket status updated" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "TICKET_NOT_FOUND") { res.status(404).json({ success: false, message: "Ticket not found", code }); return; }
    if (code === "TICKET_STATUS_FORBIDDEN") { res.status(403).json({ success: false, message: "You cannot change this ticket status", code }); return; }
    if (code === "INVALID_STATUS_TRANSITION") { res.status(409).json({ success: false, message: "Invalid ticket status transition", code }); return; }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const assign = async (req: Request, res: Response): Promise<void> => {
  const result = assignTicketSchema.safeParse(req.body);
  const ticketId = paramId(req.params.ticketId);
  if (!result.success || !Number.isSafeInteger(ticketId) || !req.user) {
    res.status(!req.user ? 401 : 400).json({ success: false, message: !req.user ? "Authentication required" : "Validation failed", code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  try {
    await assignTicket(ticketId, req.user.organizationId, req.user.id, result.data);
    res.status(200).json({ success: true, message: "Ticket assigned" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["TICKET_NOT_FOUND", "TEAM_NOT_FOUND", "ASSIGNEE_NOT_FOUND"].includes(code)) {
      res.status(404).json({ success: false, message: code === "TICKET_NOT_FOUND" ? "Ticket not found" : code === "TEAM_NOT_FOUND" ? "Team not found in this organization" : "Support agent not found in this organization", code });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};