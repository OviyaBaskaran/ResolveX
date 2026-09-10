import type { Request, Response } from "express";
import {
  createSlaPolicy,
  getSlaPolicy,
  getTicketSla,
  listSlaPolicies,
  updateSlaPolicy
} from "../services/sla.service.js";
import { assertTicketAccess } from "../services/ticket-access.service.js";
import { createSlaPolicySchema, updateSlaPolicySchema } from "../validations/sla.validation.js";

const parseId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

export const listPolicies = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  try {
    const policies = await listSlaPolicies(req.user.organizationId);
    res.status(200).json({ success: true, data: { policies } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const createPolicy = async (req: Request, res: Response): Promise<void> => {
  const result = createSlaPolicySchema.safeParse(req.body);
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const policy = await createSlaPolicy(req.user.organizationId, result.data);
    res.status(201).json({ success: true, message: "SLA policy created", data: { policy } });
  } catch (error) {
    if (error instanceof Error && error.message === "SLA_POLICY_ALREADY_EXISTS") {
      res.status(409).json({ success: false, message: "SLA policy already exists for this priority", code: error.message });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const updatePolicy = async (req: Request, res: Response): Promise<void> => {
  const result = updateSlaPolicySchema.safeParse(req.body);
  const policyId = parseId(req.params.policyId);
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  if (!result.success || !Number.isSafeInteger(policyId) || policyId <= 0) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }
  try {
    await updateSlaPolicy(policyId, req.user.organizationId, result.data.responseTimeMinutes, result.data.resolutionTimeMinutes);
    const policy = await getSlaPolicy(policyId, req.user.organizationId);
    res.status(200).json({ success: true, message: "SLA policy updated", data: { policy } });
  } catch (error) {
    if (error instanceof Error && error.message === "SLA_POLICY_NOT_FOUND") {
      res.status(404).json({ success: false, message: "SLA policy not found", code: error.message });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const getTicketSlaStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  const ticketId = parseId(req.params.ticketId);
  if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }
  try {
    await assertTicketAccess(ticketId, req.user.organizationId, req.user.id, req.user.roleCode);
    const sla = await getTicketSla(ticketId, req.user.organizationId);
    if (!sla) {
      res.status(404).json({ success: false, message: "SLA record not found", code: "SLA_NOT_FOUND" });
      return;
    }
    res.status(200).json({ success: true, data: { sla } });
  } catch (error) {
    if (error instanceof Error && error.message === "TICKET_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Ticket not found", code: "TICKET_NOT_FOUND" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
