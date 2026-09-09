import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM")
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED", "REOPENED"])
});

export const assignTicketSchema = z.object({
  teamId: z.number().int().positive().nullable(),
  assigneeId: z.number().int().positive().nullable()
});