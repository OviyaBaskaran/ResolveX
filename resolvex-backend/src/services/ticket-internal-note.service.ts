import pool from "../config/database.js";

export type CreateTicketInternalNoteInput = {
  body: string;
};

export const listTicketInternalNotes = async (ticketId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        tin.id,
        tin.ticket_id AS ticketId,
        tin.organization_id AS organizationId,
        tin.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        r.code AS roleCode,
        tin.body,
        tin.created_at AS createdAt
      FROM ticket_internal_notes tin
      INNER JOIN users u ON u.id = tin.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE tin.ticket_id = ?
        AND tin.organization_id = ?
      ORDER BY tin.created_at ASC
    `,
    [ticketId, organizationId]
  );

  return rows;
};

export const createTicketInternalNote = async (
  ticketId: number,
  organizationId: number,
  userId: number,
  input: CreateTicketInternalNoteInput
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
      INSERT INTO ticket_internal_notes (ticket_id, organization_id, user_id, body)
      VALUES (?, ?, ?, ?)
    `,
    [ticketId, organizationId, userId, input.body]
  );

  const noteId = Number((result as { insertId: number }).insertId);

  const [rows] = await pool.query(
    `
      SELECT
        tin.id,
        tin.ticket_id AS ticketId,
        tin.organization_id AS organizationId,
        tin.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        r.code AS roleCode,
        tin.body,
        tin.created_at AS createdAt
      FROM ticket_internal_notes tin
      INNER JOIN users u ON u.id = tin.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE tin.id = ?
        AND tin.organization_id = ?
      LIMIT 1
    `,
    [noteId, organizationId]
  );

  return (rows as Record<string, unknown>[])[0];
};
