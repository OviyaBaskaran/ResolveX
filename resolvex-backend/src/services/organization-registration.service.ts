import bcrypt from "bcrypt";
import pool from "../config/database.js";
import type { AuthUser } from "../types/auth.js";

const roles: [string, string][] = [
  ["Customer", "CUSTOMER"],
  ["Support Agent", "SUPPORT_AGENT"],
  ["Manager", "MANAGER"],
  ["Organization Admin", "ORGANIZATION_ADMIN"]
];

export const registerOrganization = async (input: {
  organizationName: string; organizationSlug: string; adminName: string; adminEmail: string; adminPassword: string;
}): Promise<AuthUser> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [organizationResult] = await connection.query("INSERT INTO organizations (name, slug) VALUES (?, ?)", [input.organizationName, input.organizationSlug]);
    const organizationId = Number((organizationResult as { insertId: number }).insertId);
    const roleIds = new Map<string, number>();
    for (const [name, code] of roles) {
      const [result] = await connection.query("INSERT INTO roles (organization_id, name, code) VALUES (?, ?, ?)", [organizationId, name, code]);
      roleIds.set(code, Number((result as { insertId: number }).insertId));
    }
    const passwordHash = await bcrypt.hash(input.adminPassword, 12);
    const [userResult] = await connection.query(
      "INSERT INTO users (organization_id, role_id, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')",
      [organizationId, roleIds.get("ORGANIZATION_ADMIN"), input.adminName, input.adminEmail.toLowerCase(), passwordHash]
    );
    await connection.commit();
    return { id: Number((userResult as { insertId: number }).insertId), name: input.adminName, email: input.adminEmail.toLowerCase(), organizationId, roleId: roleIds.get("ORGANIZATION_ADMIN")!, roleCode: "ORGANIZATION_ADMIN" };
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new Error("ORGANIZATION_ALREADY_EXISTS");
    throw error;
  } finally {
    connection.release();
  }
};