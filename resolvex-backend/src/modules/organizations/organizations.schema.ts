import { z } from "zod";

export const organizationRegistrationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code must contain only uppercase letters, numbers, underscores, or hyphens",
    ),

  name: z
    .string()
    .trim()
    .min(2)
    .max(150),

  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100),

  contactEmail: z.email(),

  contactPhone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .optional(),

  adminName: z
    .string()
    .trim()
    .min(2)
    .max(150),

  adminEmail: z.email(),

  adminPassword: z
    .string()
    .min(8)
    .max(128),
});

export type OrganizationRegistrationInput = z.infer<
  typeof organizationRegistrationSchema
>;