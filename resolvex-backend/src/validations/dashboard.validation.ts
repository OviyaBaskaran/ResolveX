import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format").optional();

export const dashboardQuerySchema = z.object({
  from: date,
  to: date
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be before or equal to to",
  path: ["from"]
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
