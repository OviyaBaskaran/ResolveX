import { z } from "zod";

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED", "REOPENED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  teamId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
