import pool from "../config/database.js";

export type Organization = {
  id: number;
  name: string;
  slug: string;
  status: "ACTIVE" | "DISABLED";
};

export const getOrganizationById = async (organizationId: number): Promise<Organization | undefined> => {
  const [rows] = await pool.query(
    `
      SELECT id, name, slug, status
      FROM organizations
      WHERE id = ?
      LIMIT 1
    `,
    [organizationId]
  );

  return (rows as Organization[])[0];
};

export const updateOrganizationName = async (organizationId: number, name: string): Promise<void> => {
  const [result] = await pool.query(
    `UPDATE organizations SET name = ? WHERE id = ?`,
    [name, organizationId]
  );

  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("ORGANIZATION_NOT_FOUND");
  }
};