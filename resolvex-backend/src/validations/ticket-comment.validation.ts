import { z } from "zod";

export const createTicketCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(4000, "Comment is too long"),
  type: z.enum(["CUSTOMER", "INTERNAL"]).default("CUSTOMER")
});
