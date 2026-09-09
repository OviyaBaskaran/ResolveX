import bcrypt from "bcrypt";
import pool from "../config/database.js";
import type { AuthUser } from "../types/auth.js";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  roleCode: "CUSTOMER" | "SUPPORT_AGENT" | "MANAGER";
};

export const createOrganizationUser = async (
  input: CreateUserInput,
  organizationId: number
): Promise<AuthUser> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roleRows] = await connection.query(
      `
        SELECT id, code
        FROM roles
        WHERE organization_id = ?
          AND code = ?
        LIMIT 1
      `,
      [organizationId, input.roleCode]
    );
    const role = (roleRows as { id: number; code: string }[])[0];

    if (!role) {
      throw new Error("ROLE_NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const email = input.email.toLowerCase();
    const [result] = await connection.query(
      `
        INSERT INTO users (organization_id, role_id, name, email, password_hash, status)
        VALUES (?, ?, ?, ?, ?, 'ACTIVE')
      `,
      [organizationId, role.id, input.name, email, passwordHash]
    );

    await connection.commit();

    return {
      id: Number((result as { insertId: number }).insertId),
      name: input.name,
      email,
      organizationId,
      roleId: role.id,
      roleCode: role.code
    };
  } catch (error) {
    await connection.rollback();

    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    throw error;
  } finally {
    connection.release();
  }
};

type OrganizationUser = AuthUser & { status: "ACTIVE" | "DISABLED" };

export const listOrganizationUsers = async (organizationId: number): Promise<OrganizationUser[]> => {
  const [rows] = await pool.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.organization_id AS organizationId,
        u.role_id AS roleId,
        r.code AS roleCode,
        u.status
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.organization_id = ?
      ORDER BY u.id DESC
    `,
    [organizationId]
  );

  return rows as OrganizationUser[];
};

export const updateOrganizationUserStatus = async (
  userId: number,
  organizationId: number,
  status: "ACTIVE" | "DISABLED"
): Promise<void> => {
  const [result] = await pool.query(
    "UPDATE users SET status = ? WHERE id = ? AND organization_id = ?",
    [status, userId, organizationId]
  );

  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  if (status === "DISABLED") {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL",
      [userId]
    );
  }
};

export const updateOrganizationUserRole = async (
  userId: number,
  organizationId: number,
  roleCode: "CUSTOMER" | "SUPPORT_AGENT" | "MANAGER"
): Promise<void> => {
  const [roleRows] = await pool.query(
    "SELECT id FROM roles WHERE organization_id = ? AND code = ? LIMIT 1",
    [organizationId, roleCode]
  );
  const role = (roleRows as { id: number }[])[0];

  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }

  const [result] = await pool.query(
    "UPDATE users SET role_id = ? WHERE id = ? AND organization_id = ?",
    [role.id, userId, organizationId]
  );

  if ((result as { affectedRows: number }).affectedRows === 0) {
    throw new Error("USER_NOT_FOUND");
  }
};