import { z } from "zod";

export const platformLoginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1)
});

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "DISABLED"])
});
