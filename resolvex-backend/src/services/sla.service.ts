import pool from "../config/database.js";

export type SlaPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CreateSlaPolicyInput = {
  priority: SlaPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
};

export const listSlaPolicies = async (organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        organization_id AS organizationId,
        priority,
        response_time_minutes AS responseTimeMinutes,
        resolution_time_minutes AS resolutionTimeMinutes,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM sla_policies
      WHERE organization_id = ?
      ORDER BY FIELD(priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
    `,
    [organizationId]
  );
  return rows;
};

export const createSlaPolicy = async (organizationId: number, input: CreateSlaPolicyInput) => {
  try {
    const [result] = await pool.query(
      `
        INSERT INTO sla_policies (organization_id, priority, response_time_minutes, resolution_time_minutes)
        VALUES (?, ?, ?, ?)
      `,
      [organizationId, input.priority, input.responseTimeMinutes, input.resolutionTimeMinutes]
    );
    return getSlaPolicy(Number((result as { insertId: number }).insertId), organizationId);
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("SLA_POLICY_ALREADY_EXISTS");
    }
    throw error;
  }
};

export const getSlaPolicy = async (policyId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        organization_id AS organizationId,
        priority,
        response_time_minutes AS responseTimeMinutes,
        resolution_time_minutes AS resolutionTimeMinutes,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM sla_policies
      WHERE id = ? AND organization_id = ?
      LIMIT 1
    `,
    [policyId, organizationId]
  );
  return (rows as Record<string, unknown>[])[0];
};

export const updateSlaPolicy = async (
  policyId: number,
  organizationId: number,
  responseTimeMinutes: number,
  resolutionTimeMinutes: number
): Promise<void> => {
  const [result] = await pool.query(
    `
      UPDATE sla_policies
      SET response_time_minutes = ?, resolution_time_minutes = ?, is_active = TRUE
      WHERE id = ? AND organization_id = ?
    `,
    [responseTimeMinutes, resolutionTimeMinutes, policyId, organizationId]
  );
  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("SLA_POLICY_NOT_FOUND");
  }
};

export const getTicketSla = async (ticketId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        ticket_id AS ticketId,
        organization_id AS organizationId,
        priority,
        response_due_at AS responseDueAt,
        resolution_due_at AS resolutionDueAt,
        first_responded_at AS firstRespondedAt,
        resolved_at AS resolvedAt,
        response_breached AS responseBreached,
        resolution_breached AS resolutionBreached,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM ticket_sla
      WHERE ticket_id = ? AND organization_id = ?
      LIMIT 1
    `,
    [ticketId, organizationId]
  );
  return (rows as Record<string, unknown>[])[0];
};

export const createTicketSlaIfConfigured = async (
  ticketId: number,
  organizationId: number,
  priority: SlaPriority
): Promise<void> => {
  const [rows] = await pool.query(
    `
      SELECT response_time_minutes AS responseTimeMinutes,
        resolution_time_minutes AS resolutionTimeMinutes
      FROM sla_policies
      WHERE organization_id = ? AND priority = ? AND is_active = TRUE
      LIMIT 1
    `,
    [organizationId, priority]
  );
  const policy = (rows as { responseTimeMinutes: number; resolutionTimeMinutes: number }[])[0];
  if (!policy) return;

  await pool.query(
    `
      INSERT INTO ticket_sla (
        ticket_id, organization_id, priority, response_due_at, resolution_due_at
      ) VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE), DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))
    `,
    [ticketId, organizationId, priority, policy.responseTimeMinutes, policy.resolutionTimeMinutes]
  );
};
