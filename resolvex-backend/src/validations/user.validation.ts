import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(150),
  email: z.string().trim().pipe(z.email({ message: "Please enter a valid email address" })),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72),
  roleCode: z.enum(["CUSTOMER", "SUPPORT_AGENT", "MANAGER"])
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"])
});

export const updateUserRoleSchema = z.object({
  roleCode: z.enum(["CUSTOMER", "SUPPORT_AGENT", "MANAGER"])
});