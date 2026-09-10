import pool from "../config/database.js";

export type CreateAuditLogInput = {
  actorId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
};

export const createAuditLog = async (organizationId: number, input: CreateAuditLogInput): Promise<void> => {
  await pool.query(
    `
      INSERT INTO audit_logs (
        organization_id,
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      organizationId,
      input.actorId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
};

export const listAuditLogs = async (organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        al.id,
        al.organization_id AS organizationId,
        al.actor_id AS actorId,
        u.name AS actorName,
        u.email AS actorEmail,
        al.action,
        al.entity_type AS entityType,
        al.entity_id AS entityId,
        al.metadata,
        al.created_at AS createdAt
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      WHERE al.organization_id = ?
      ORDER BY al.created_at DESC, al.id DESC
    `,
    [organizationId]
  );

  return rows;
};
