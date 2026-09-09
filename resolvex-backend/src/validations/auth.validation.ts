import { z } from "zod";

export const loginSchema = z.object({
  organizationSlug: z
    .string()
    .trim()
    .min(1, "Organization slug is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(
      z.email({
        message: "Please enter a valid email address"
      })
    ),

  password: z
    .string()
    .min(1, "Password is required")
});

export const registerSchema = z.object({
  organizationSlug: z.string().trim().min(1, "Organization slug is required"),
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(150),
  email: z
    .string()
    .trim()
    .pipe(z.email({ message: "Please enter a valid email address" })),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72)
});

export const forgotPasswordSchema = z.object({
  organizationSlug: z.string().trim().min(1, "Organization slug is required"),
  email: z.string().trim().pipe(z.email({ message: "Please enter a valid email address" }))
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must contain at least 8 characters").max(72)
});