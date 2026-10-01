import { z } from "zod";

export const loginSchema = z.object({
  organizationCode: z
    .string()
    .trim()
    .min(2)
    .max(50),

  email: z
    .email()
    .transform((value) => value.trim().toLowerCase()),

  password: z
    .string()
    .min(1)
    .max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

