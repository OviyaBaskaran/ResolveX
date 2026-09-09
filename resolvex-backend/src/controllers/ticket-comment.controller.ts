import type { Request, Response } from "express";
import { createTicketComment, listTicketComments } from "../services/ticket-comment.service.js";
import { createTicketCommentSchema } from "../validations/ticket-comment.validation.js";

const parseTicketId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

export const listComments = async (req: Request, res: Response): Promise<void> => {
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
    const comments = await listTicketComments(ticketId, req.user.organizationId);
    res.status(200).json({ success: true, data: { comments } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const result = createTicketCommentSchema.safeParse(req.body);
  const ticketId = parseTicketId(req.params.ticketId);

  if (!result.success || !Number.isSafeInteger(ticketId)) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    const comment = await createTicketComment(ticketId, req.user.organizationId, req.user.id, result.data);
    res.status(201).json({ success: true, message: "Comment created", data: { comment } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "TICKET_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Ticket not found", code });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
