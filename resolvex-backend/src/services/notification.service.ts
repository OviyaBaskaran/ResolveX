import pool from "../config/database.js";

export type CreateNotificationInput = {
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
};

export const createNotification = async (organizationId: number, input: CreateNotificationInput): Promise<void> => {
  await pool.query(
    `
      INSERT INTO notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      organizationId,
      input.userId,
      input.type,
      input.title,
      input.message,
      input.entityType ?? null,
      input.entityId ?? null
    ]
  );
};

export const notifyOrganizationStaff = async (
  organizationId: number,
  input: Omit<CreateNotificationInput, "userId">
): Promise<void> => {
  const [rows] = await pool.query(
    `
      SELECT u.id
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.organization_id = ?
        AND u.status = 'ACTIVE'
        AND r.code IN ('SUPPORT_AGENT', 'MANAGER', 'ORGANIZATION_ADMIN')
    `,
    [organizationId]
  );

  await Promise.all(
    (rows as { id: number }[]).map(({ id }) => createNotification(organizationId, { ...input, userId: id }))
  );
};

export const listNotifications = async (userId: number, organizationId: number) => {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        organization_id AS organizationId,
        user_id AS userId,
        type,
        title,
        message,
        entity_type AS entityType,
        entity_id AS entityId,
        read_at AS readAt,
        created_at AS createdAt
      FROM notifications
      WHERE user_id = ?
        AND organization_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [userId, organizationId]
  );

  return rows;
};

export const countUnreadNotifications = async (userId: number, organizationId: number): Promise<number> => {
  const [rows] = await pool.query(
    `
      SELECT COUNT(*) AS unreadCount
      FROM notifications
      WHERE user_id = ?
        AND organization_id = ?
        AND read_at IS NULL
    `,
    [userId, organizationId]
  );

  return Number((rows as { unreadCount: number }[])[0]?.unreadCount ?? 0);
};

export const markNotificationRead = async (
  notificationId: number,
  userId: number,
  organizationId: number
): Promise<void> => {
  const [result] = await pool.query(
    `
      UPDATE notifications
      SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = ?
        AND user_id = ?
        AND organization_id = ?
    `,
    [notificationId, userId, organizationId]
  );

  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }
};

export const markAllNotificationsRead = async (userId: number, organizationId: number): Promise<number> => {
  const [result] = await pool.query(
    `
      UPDATE notifications
      SET read_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND organization_id = ?
        AND read_at IS NULL
    `,
    [userId, organizationId]
  );

  return (result as { affectedRows: number }).affectedRows;
};
