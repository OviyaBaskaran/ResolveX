import { z } from "zod";

export const platformLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;