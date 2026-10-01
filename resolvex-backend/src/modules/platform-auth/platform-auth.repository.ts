import type { RowDataPacket } from "mysql2";

import pool from "../../config/database.js";

export type PlatformAdminRecord = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
  lastLoginAt: Date | null;
};

type PlatformAdminRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  status: "ACTIVE" | "DISABLED";
  last_login_at: Date | null;
};

export async function findPlatformAdminByEmail(
  email: string,
): Promise<PlatformAdminRecord | null> {
  const [rows] = await pool.query<PlatformAdminRow[]>(
    `
      SELECT
        id,
        name,
        email,
        password_hash,
        status,
        last_login_at
      FROM platform_admins
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  const admin = rows[0];

  if (!admin) {
    return null;
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    passwordHash: admin.password_hash,
    status: admin.status,
    lastLoginAt: admin.last_login_at,
  };
}

export async function updatePlatformAdminLastLogin(
  adminId: number,
): Promise<void> {
  await pool.query(
    `
      UPDATE platform_admins
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [adminId],
  );
}