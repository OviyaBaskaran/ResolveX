import { z } from "zod";

export const createTicketAttachmentSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required").max(255, "File name is too long"),
  mimeType: z.string().trim().min(1, "Mime type is required").max(120, "Mime type is too long"),
  fileSize: z.number().int().nonnegative("File size must be zero or greater").max(50 * 1024 * 1024, "File size is too large"),
  url: z.string().url("Attachment URL is invalid").max(500, "Attachment URL is too long"),
  publicId: z.string().trim().min(1, "Public ID is required").max(500, "Public ID is too long")
});
