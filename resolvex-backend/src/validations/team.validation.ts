import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name must contain at least 2 characters").max(150),
  description: z.string().trim().max(500).optional(),
  managerId: z.number().int().positive().optional()
});

export const assignManagerSchema = z.object({
  managerId: z.number().int().positive().nullable()
});

export const teamMemberSchema = z.object({
  userId: z.number().int().positive()
});