import { z } from "zod";

export const createTicketInternalNoteSchema = z.object({
  body: z.string().trim().min(1, "Internal note cannot be empty").max(4000, "Internal note is too long")
});
