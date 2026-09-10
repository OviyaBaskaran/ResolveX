import pool from "../config/database.js";

export const listPlatformOrganizations = async () => {
  const [rows] = await pool.query(
    `
      SELECT
        o.id,
        o.name,
        o.slug,
        o.status,
        o.created_at AS createdAt,
        COUNT(DISTINCT u.id) AS userCount,
        COUNT(DISTINCT t.id) AS ticketCount
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN tickets t ON t.organization_id = o.id
      GROUP BY o.id, o.name, o.slug, o.status, o.created_at
      ORDER BY o.id DESC
    `
  );
  return rows;
};

export const updatePlatformOrganizationStatus = async (
  organizationId: number,
  status: "PENDING" | "ACTIVE" | "DISABLED"
): Promise<void> => {
  const [result] = await pool.query(
    "UPDATE organizations SET status = ? WHERE id = ?",
    [status, organizationId]
  );
  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }
};
