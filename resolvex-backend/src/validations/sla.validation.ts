import { z } from "zod";

const priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const createSlaPolicySchema = z.object({
  priority,
  responseTimeMinutes: z.number().int().positive().max(525600),
  resolutionTimeMinutes: z.number().int().positive().max(525600)
});

export const updateSlaPolicySchema = createSlaPolicySchema.omit({ priority: true });
