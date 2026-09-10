import pool from "../config/database.js";
import { assertTicketAccess } from "./ticket-access.service.js";

type CreateTicketCommentInput = {
  body: string;
  type: "CUSTOMER" | "INTERNAL";
};

export const listTicketComments = async (ticketId: number, organizationId: number, userId: number, roleCode: string) => {
  await assertTicketAccess(ticketId, organizationId, userId, roleCode);
  const internalFilter = roleCode === "CUSTOMER" ? " AND tc.type = 'CUSTOMER'" : "";
  const [rows] = await pool.query(
    `
      SELECT
        tc.id,
        tc.ticket_id AS ticketId,
        tc.organization_id AS organizationId,
        tc.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        r.code AS roleCode,
        tc.type,
        tc.body,
        tc.created_at AS createdAt
      FROM ticket_comments tc
      INNER JOIN users u ON u.id = tc.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE tc.ticket_id = ?
        AND tc.organization_id = ?${internalFilter}
      ORDER BY tc.created_at ASC
    `,
    [ticketId, organizationId]
  );

  return rows;
};

export const createTicketComment = async (
  ticketId: number,
  organizationId: number,
  userId: number,
  roleCode: string,
  input: CreateTicketCommentInput
) => {
  await assertTicketAccess(ticketId, organizationId, userId, roleCode);
  if (input.type === "INTERNAL" && roleCode === "CUSTOMER") {
    throw new Error("INTERNAL_COMMENT_FORBIDDEN");
  }

  const [result] = await pool.query(
    `
      INSERT INTO ticket_comments (ticket_id, organization_id, user_id, type, body)
      VALUES (?, ?, ?, ?, ?)
    `,
    [ticketId, organizationId, userId, input.type, input.body]
  );

  const commentId = Number((result as { insertId: number }).insertId);

  const [rows] = await pool.query(
    `
      SELECT
        tc.id,
        tc.ticket_id AS ticketId,
        tc.organization_id AS organizationId,
        tc.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        r.code AS roleCode,
        tc.type,
        tc.body,
        tc.created_at AS createdAt
      FROM ticket_comments tc
      INNER JOIN users u ON u.id = tc.user_id
      INNER JOIN roles r ON r.id = u.role_id
      WHERE tc.id = ?
        AND tc.organization_id = ?
      LIMIT 1
    `,
    [commentId, organizationId]
  );

  return (rows as Record<string, unknown>[])[0];
};
