import pool from "../config/database.js";

const staffRoles = ["SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"];

/** Ensures a user can access a ticket without revealing tickets they do not own. */
export const assertTicketAccess = async (
  ticketId: number,
  organizationId: number,
  userId: number,
  roleCode: string
): Promise<void> => {
  const isStaff = staffRoles.includes(roleCode);
  const customerFilter = isStaff ? "" : " AND customer_id = ?";
  const parameters = isStaff ? [ticketId, organizationId] : [ticketId, organizationId, userId];
  const [rows] = await pool.query(
    `SELECT id FROM tickets WHERE id = ? AND organization_id = ?${customerFilter} LIMIT 1`,
    parameters
  );

  if ((rows as { id: number }[]).length === 0) {
    throw new Error("TICKET_NOT_FOUND");
  }
};
