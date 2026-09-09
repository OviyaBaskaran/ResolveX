import { z } from "zod";

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name must contain at least 2 characters").max(150)
});

export const registerOrganizationSchema = z.object({
  organizationName: z.string().trim().min(2).max(150),
  organizationSlug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  adminName: z.string().trim().min(2).max(150),
  adminEmail: z.string().trim().pipe(z.email()),
  adminPassword: z.string().min(8).max(72)
});