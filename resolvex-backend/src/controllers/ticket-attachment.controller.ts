import type { Request, Response } from "express";
import cloudinary from "../config/cloudinary.js";
import { createTicketAttachment, listTicketAttachments } from "../services/ticket-attachment.service.js";
import { createTicketAttachmentSchema } from "../validations/ticket-attachment.validation.js";

const parseTicketId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

const uploadToCloudinary = (file: Express.Multer.File, ticketId: number): Promise<{ secureUrl: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `resolvex/tickets/${ticketId}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("CLOUDINARY_UPLOAD_FAILED"));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(file.buffer);
  });

export const listAttachments = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const ticketId = parseTicketId(req.params.ticketId);
  if (!Number.isSafeInteger(ticketId)) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const attachments = await listTicketAttachments(ticketId, req.user.organizationId);
    res.status(200).json({ success: true, data: { attachments } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const createAttachment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const ticketId = parseTicketId(req.params.ticketId);
  if (!Number.isSafeInteger(ticketId)) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "File is required", code: "FILE_REQUIRED" });
      return;
    }

    const uploadResult = await uploadToCloudinary(file, ticketId);

    const result = createTicketAttachmentSchema.safeParse({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      url: uploadResult.secureUrl,
      publicId: uploadResult.publicId
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: result.error.issues
      });
      return;
    }

    const attachment = await createTicketAttachment(ticketId, req.user.organizationId, req.user.id, result.data);
    res.status(201).json({ success: true, message: "Attachment uploaded", data: { attachment } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "TICKET_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Ticket not found", code });
      return;
    }
    console.error("Ticket attachment upload failed:", error);
    if (code === "CLOUDINARY_UPLOAD_FAILED" || (error && typeof error === "object" && "http_code" in error)) {
      res.status(502).json({ success: false, message: "File storage upload failed", code: "CLOUDINARY_UPLOAD_FAILED" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
