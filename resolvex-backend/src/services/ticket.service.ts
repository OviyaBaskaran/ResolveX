import pool from "../config/database.js";
import { createNotification, notifyOrganizationStaff } from "./notification.service.js";
import { createTicketSlaIfConfigured } from "./sla.service.js";

type CreateTicketInput = { subject: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };
type AssignmentInput = { teamId: number | null; assigneeId: number | null };

const staffRoles = ["SUPPORT_AGENT", "MANAGER", "ORGANIZATION_ADMIN"];

export const createTicket = async (input: CreateTicketInput, organizationId: number, customerId: number) => {
  const [result] = await pool.query(
    `INSERT INTO tickets (organization_id, customer_id, subject, description, priority) VALUES (?, ?, ?, ?, ?)`,
    [organizationId, customerId, input.subject, input.description, input.priority]
  );
  const ticketId = Number((result as { insertId: number }).insertId);
  try {
    await createTicketSlaIfConfigured(ticketId, organizationId, input.priority);
  } catch (error) {
    console.error("Ticket SLA creation failed:", error);
  }
  try {
    await notifyOrganizationStaff(organizationId, {
      type: "TICKET_CREATED",
      title: "New ticket created",
      message: input.subject,
      entityType: "TICKET",
      entityId: ticketId
    });
  } catch (error) {
    console.error("Ticket creation notification failed:", error);
  }

  return getTicketById(ticketId, organizationId, customerId, false);
};

export const listTickets = async (organizationId: number, userId: number, roleCode: string) => {
  const customerFilter = staffRoles.includes(roleCode) ? "" : " AND t.customer_id = ?";
  const params = staffRoles.includes(roleCode) ? [organizationId] : [organizationId, userId];
  const [rows] = await pool.query(
    `
      SELECT t.id, t.organization_id AS organizationId, t.customer_id AS customerId,
        t.team_id AS teamId, t.assignee_id AS assigneeId, t.subject, t.description,
        t.status, t.priority, t.created_at AS createdAt, t.updated_at AS updatedAt
      FROM tickets t
      WHERE t.organization_id = ?${customerFilter}
      ORDER BY t.id DESC
    `,
    params
  );
  return rows;
};

export const getTicketById = async (ticketId: number, organizationId: number, userId: number, isStaff: boolean) => {
  const customerFilter = isStaff ? "" : " AND t.customer_id = ?";
  const params = isStaff ? [ticketId, organizationId] : [ticketId, organizationId, userId];
  const [rows] = await pool.query(
    `
      SELECT t.id, t.organization_id AS organizationId, t.customer_id AS customerId,
        t.team_id AS teamId, t.assignee_id AS assigneeId, t.subject, t.description,
        t.status, t.priority, t.created_at AS createdAt, t.updated_at AS updatedAt
      FROM tickets t
      WHERE t.id = ? AND t.organization_id = ?${customerFilter}
      LIMIT 1
    `,
    params
  );
  return (rows as Record<string, unknown>[])[0];
};

const validTransitions: Record<string, string[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS"]
};

export const updateTicketStatus = async (
  ticketId: number,
  organizationId: number,
  actorId: number,
  roleCode: string,
  status: string
): Promise<void> => {
  const [rows] = await pool.query(
    `
      SELECT t.status, t.assignee_id AS assigneeId, t.team_id AS teamId,
        team.manager_id AS managerId
      FROM tickets t
      LEFT JOIN teams team ON team.id = t.team_id
      WHERE t.id = ? AND t.organization_id = ?
      LIMIT 1
    `,
    [ticketId, organizationId]
  );
  const ticket = (rows as { status: string; assigneeId: number | null; teamId: number | null; managerId: number | null }[])[0];
  if (!ticket) throw new Error("TICKET_NOT_FOUND");
  const canManageAnyTicket = roleCode === "ORGANIZATION_ADMIN";
  const isAssignedAgent = roleCode === "SUPPORT_AGENT" && ticket.assigneeId === actorId;
  const isTeamManager = roleCode === "MANAGER" && ticket.managerId === actorId;

  if (!canManageAnyTicket && !isAssignedAgent && !isTeamManager) {
    throw new Error("TICKET_STATUS_FORBIDDEN");
  }

  if (!validTransitions[ticket.status]?.includes(status)) throw new Error("INVALID_STATUS_TRANSITION");

  await pool.query(
    `UPDATE tickets SET status = ?, resolved_at = IF(? = 'RESOLVED', CURRENT_TIMESTAMP, resolved_at), closed_at = IF(? = 'CLOSED', CURRENT_TIMESTAMP, closed_at) WHERE id = ? AND organization_id = ?`,
    [status, status, status, ticketId, organizationId]
  );

  try {
    const [customerRows] = await pool.query(
      "SELECT customer_id AS customerId FROM tickets WHERE id = ? AND organization_id = ? LIMIT 1",
      [ticketId, organizationId]
    );
    const customerId = (customerRows as { customerId: number }[])[0]?.customerId;
    if (customerId) {
      await createNotification(organizationId, {
        userId: customerId,
        type: "TICKET_STATUS_CHANGED",
        title: "Ticket status updated",
        message: `Ticket #${ticketId} is now ${status}`,
        entityType: "TICKET",
        entityId: ticketId
      });
    }
  } catch (error) {
    console.error("Ticket status notification failed:", error);
  }
};

export const assignTicket = async (
  ticketId: number,
  organizationId: number,
  assignedBy: number,
  input: AssignmentInput
): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [tickets] = await connection.query("SELECT id FROM tickets WHERE id = ? AND organization_id = ? FOR UPDATE", [ticketId, organizationId]);
    if ((tickets as { id: number }[]).length === 0) throw new Error("TICKET_NOT_FOUND");

    if (input.teamId !== null) {
      const [teams] = await connection.query("SELECT id FROM teams WHERE id = ? AND organization_id = ?", [input.teamId, organizationId]);
      if ((teams as { id: number }[]).length === 0) throw new Error("TEAM_NOT_FOUND");
    }
    if (input.assigneeId !== null) {
      const [agents] = await connection.query(
        `SELECT u.id FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE u.id = ? AND u.organization_id = ? AND u.status = 'ACTIVE' AND r.code = 'SUPPORT_AGENT'`,
        [input.assigneeId, organizationId]
      );
      if ((agents as { id: number }[]).length === 0) throw new Error("ASSIGNEE_NOT_FOUND");
    }

    await connection.query(
      "UPDATE tickets SET team_id = ?, assignee_id = ?, status = IF(status = 'OPEN', 'ASSIGNED', status) WHERE id = ? AND organization_id = ?",
      [input.teamId, input.assigneeId, ticketId, organizationId]
    );
    await connection.query(
      "INSERT INTO ticket_assignment_history (ticket_id, organization_id, team_id, assignee_id, assigned_by) VALUES (?, ?, ?, ?, ?)",
      [ticketId, organizationId, input.teamId, input.assigneeId, assignedBy]
    );
    await connection.commit();

    if (input.assigneeId !== null) {
      try {
        await createNotification(organizationId, {
          userId: input.assigneeId,
          type: "TICKET_ASSIGNED",
          title: "Ticket assigned to you",
          message: `Ticket #${ticketId} has been assigned to you`,
          entityType: "TICKET",
          entityId: ticketId
        });
      } catch (error) {
        console.error("Ticket assignment notification failed:", error);
      }
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};