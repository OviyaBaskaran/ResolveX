import pool from "../config/database.js";

export type CreateTicketAttachmentInput = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  publicId: string;
};

export const listTicketAttachments = async (ticketId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        ta.id,
        ta.ticket_id AS ticketId,
        ta.organization_id AS organizationId,
        ta.uploaded_by AS uploadedBy,
        u.name AS uploadedByName,
        u.email AS uploadedByEmail,
        r.code AS uploadedByRole,
        ta.file_name AS fileName,
        ta.mime_type AS mimeType,
        ta.file_size AS fileSize,
        ta.url AS url,
        ta.public_id AS publicId,
        ta.created_at AS createdAt
      FROM ticket_attachments ta
      INNER JOIN users u ON u.id = ta.uploaded_by
      INNER JOIN roles r ON r.id = u.role_id
      WHERE ta.ticket_id = ?
        AND ta.organization_id = ?
      ORDER BY ta.created_at DESC
    `,
    [ticketId, organizationId]
  );

  return rows;
};

export const createTicketAttachment = async (
  ticketId: number,
  organizationId: number,
  uploadedBy: number,
  input: CreateTicketAttachmentInput
) => {
  const [ticketRows] = await pool.query(
    `SELECT id FROM tickets WHERE id = ? AND organization_id = ? LIMIT 1`,
    [ticketId, organizationId]
  );

  if ((ticketRows as { id: number }[]).length === 0) {
    throw new Error("TICKET_NOT_FOUND");
  }

  const [result] = await pool.query(
    `
      INSERT INTO ticket_attachments (
        ticket_id,
        organization_id,
        uploaded_by,
        file_name,
        mime_type,
        file_size,
        url,
        public_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [ticketId, organizationId, uploadedBy, input.fileName, input.mimeType, input.fileSize, input.url, input.publicId]
  );

  const attachmentId = Number((result as { insertId: number }).insertId);

  const [rows] = await pool.query(
    `
      SELECT
        ta.id,
        ta.ticket_id AS ticketId,
        ta.organization_id AS organizationId,
        ta.uploaded_by AS uploadedBy,
        u.name AS uploadedByName,
        u.email AS uploadedByEmail,
        r.code AS uploadedByRole,
        ta.file_name AS fileName,
        ta.mime_type AS mimeType,
        ta.file_size AS fileSize,
        ta.url AS url,
        ta.public_id AS publicId,
        ta.created_at AS createdAt
      FROM ticket_attachments ta
      INNER JOIN users u ON u.id = ta.uploaded_by
      INNER JOIN roles r ON r.id = u.role_id
      WHERE ta.id = ?
        AND ta.organization_id = ?
      LIMIT 1
    `,
    [attachmentId, organizationId]
  );

  return (rows as Record<string, unknown>[])[0];
};
