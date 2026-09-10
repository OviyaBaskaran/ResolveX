import pool from "../config/database.js";
import type { DashboardQuery } from "../validations/dashboard.validation.js";

const buildDateFilter = (query: DashboardQuery, column: string): { clause: string; params: string[] } => {
  const clauses: string[] = [];
  const params: string[] = [];
  if (query.from) {
    clauses.push(`${column} >= ?`);
    params.push(`${query.from} 00:00:00`);
  }
  if (query.to) {
    clauses.push(`${column} < DATE_ADD(?, INTERVAL 1 DAY)`);
    params.push(query.to);
  }
  return { clause: clauses.length ? ` AND ${clauses.join(" AND ")}` : "", params };
};

export const getDashboardSummary = async (organizationId: number, query: DashboardQuery) => {
  const ticketFilter = buildDateFilter(query, "t.created_at");
  const [summaryRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS totalTickets,
        SUM(t.status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER')) AS openTickets,
        SUM(t.status IN ('RESOLVED', 'CLOSED')) AS completedTickets,
        SUM(t.priority = 'CRITICAL') AS criticalTickets
      FROM tickets t
      WHERE t.organization_id = ?${ticketFilter.clause}
    `,
    [organizationId, ...ticketFilter.params]
  );

  const [statusRows] = await pool.query(
    `
      SELECT t.status, COUNT(*) AS count
      FROM tickets t
      WHERE t.organization_id = ?${ticketFilter.clause}
      GROUP BY t.status
      ORDER BY t.status
    `,
    [organizationId, ...ticketFilter.params]
  );

  const [priorityRows] = await pool.query(
    `
      SELECT t.priority, COUNT(*) AS count
      FROM tickets t
      WHERE t.organization_id = ?${ticketFilter.clause}
      GROUP BY t.priority
      ORDER BY FIELD(t.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
    `,
    [organizationId, ...ticketFilter.params]
  );

  const [slaRows] = await pool.query(
    `
      SELECT
        COUNT(*) AS trackedTickets,
        SUM(ts.response_breached = TRUE) AS responseBreaches,
        SUM(ts.resolution_breached = TRUE) AS resolutionBreaches
      FROM ticket_sla ts
      WHERE ts.organization_id = ?
    `,
    [organizationId]
  );

  const [userRows] = await pool.query(
    `SELECT COUNT(*) AS activeUsers FROM users WHERE organization_id = ? AND status = 'ACTIVE'`,
    [organizationId]
  );

  return {
    summary: (summaryRows as Record<string, unknown>[])[0],
    byStatus: statusRows,
    byPriority: priorityRows,
    sla: (slaRows as Record<string, unknown>[])[0],
    activeUsers: Number((userRows as { activeUsers: number }[])[0]?.activeUsers ?? 0)
  };
};

export const getTicketReport = async (organizationId: number, query: DashboardQuery) => {
  const ticketFilter = buildDateFilter(query, "t.created_at");
  const [rows] = await pool.query(
    `
      SELECT
        t.id,
        t.subject,
        t.status,
        t.priority,
        t.customer_id AS customerId,
        customer.name AS customerName,
        t.team_id AS teamId,
        team.name AS teamName,
        t.assignee_id AS assigneeId,
        assignee.name AS assigneeName,
        t.created_at AS createdAt,
        t.updated_at AS updatedAt,
        t.resolved_at AS resolvedAt,
        t.closed_at AS closedAt,
        ts.response_due_at AS responseDueAt,
        ts.resolution_due_at AS resolutionDueAt,
        ts.response_breached AS responseBreached,
        ts.resolution_breached AS resolutionBreached
      FROM tickets t
      INNER JOIN users customer ON customer.id = t.customer_id
      LEFT JOIN teams team ON team.id = t.team_id
      LEFT JOIN users assignee ON assignee.id = t.assignee_id
      LEFT JOIN ticket_sla ts ON ts.ticket_id = t.id AND ts.organization_id = t.organization_id
      WHERE t.organization_id = ?${ticketFilter.clause}
      ORDER BY t.created_at DESC, t.id DESC
    `,
    [organizationId, ...ticketFilter.params]
  );

  return rows;
};
