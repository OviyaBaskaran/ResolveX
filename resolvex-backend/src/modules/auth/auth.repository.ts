import type { RowDataPacket } from "mysql2";

import pool from "../../config/database.js";

export type LoginUserRow = RowDataPacket & {
  user_id: number;
  organization_id: number;
  organization_code: string;
  organization_status: "PENDING" | "ACTIVE" | "DISABLED";
  user_name: string;
  user_email: string;
  password_hash: string;
  user_status: "ACTIVE" | "DISABLED";
  must_change_password: number;
  role_id: number;
  role_code:
    | "CUSTOMER"
    | "SUPPORT_AGENT"
    | "MANAGER"
    | "ORGANIZATION_ADMIN";
  role_name: string;
};

export type RefreshTokenRow = RowDataPacket & {
  id: number;
  organization_id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;

  user_name: string;
  user_email: string;
  user_status: "ACTIVE" | "DISABLED";

  organization_code: string;
  organization_status:
    | "PENDING"
    | "ACTIVE"
    | "DISABLED";

  role_id: number;
  role_code:
    | "CUSTOMER"
    | "SUPPORT_AGENT"
    | "MANAGER"
    | "ORGANIZATION_ADMIN";
  role_name: string;
};

export async function findUserForLogin(
  organizationCode: string,
  email: string,
): Promise<LoginUserRow | null> {
  const [rows] = await pool.query<LoginUserRow[]>(
    `
      SELECT
        u.id AS user_id,
        u.organization_id,
        o.code AS organization_code,
        o.status AS organization_status,
        u.name AS user_name,
        u.email AS user_email,
        u.password_hash,
        u.status AS user_status,
        u.must_change_password,
        r.id AS role_id,
        r.code AS role_code,
        r.name AS role_name
      FROM users u
      INNER JOIN organizations o
        ON o.id = u.organization_id
      INNER JOIN roles r
        ON r.id = u.role_id
       AND r.organization_id = u.organization_id
      WHERE o.code = ?
        AND u.email = ?
      LIMIT 1
    `,
    [organizationCode, email],
  );

  return rows[0] ?? null;
}

export async function createRefreshToken(
  input: {
    userId: number;
    organizationId: number;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
  },
): Promise<number> {
  const [result] = await pool.execute(
    `
      INSERT INTO refresh_tokens (
        organization_id,
        user_id,
        token_hash,
        expires_at,
        user_agent,
        ip_address
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.userId,
      input.tokenHash,
      input.expiresAt,
      input.userAgent ?? null,
      input.ipAddress ?? null,
    ],
  );

  return Number(
    (result as { insertId: number }).insertId,
  );
}

export async function updateLastLoginAt(
  userId: number,
): Promise<void> {
  await pool.execute(
    `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [userId],
  );
}

export async function findRefreshToken(
  tokenHash: string,
): Promise<RefreshTokenRow | null> {
  const [rows] =
    await pool.query<RefreshTokenRow[]>(
      `
        SELECT
          rt.id,
          rt.organization_id,
          rt.user_id,
          rt.token_hash,
          rt.expires_at,
          rt.revoked_at,

          u.name AS user_name,
          u.email AS user_email,
          u.status AS user_status,

          o.code AS organization_code,
          o.status AS organization_status,

          r.id AS role_id,
          r.code AS role_code,
          r.name AS role_name

        FROM refresh_tokens rt

        INNER JOIN users u
          ON u.id = rt.user_id
         AND u.organization_id = rt.organization_id

        INNER JOIN organizations o
          ON o.id = rt.organization_id

        INNER JOIN roles r
          ON r.id = u.role_id
         AND r.organization_id = u.organization_id

        WHERE rt.token_hash = ?
        LIMIT 1
      `,
      [tokenHash],
    );

  return rows[0] ?? null;
}

export async function rotateRefreshToken(
  input: {
    currentTokenId: number;
    userId: number;
    organizationId: number;
    newTokenHash: string;
    expiresAt: Date;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
  },
): Promise<number> {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `
        UPDATE refresh_tokens
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND revoked_at IS NULL
      `,
      [input.currentTokenId],
    );

    const [result] =
      await connection.execute(
        `
          INSERT INTO refresh_tokens (
            organization_id,
            user_id,
            token_hash,
            expires_at,
            user_agent,
            ip_address
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          input.organizationId,
          input.userId,
          input.newTokenHash,
          input.expiresAt,
          input.userAgent ?? null,
          input.ipAddress ?? null,
        ],
      );

    const newTokenId = Number(
      (result as { insertId: number })
        .insertId,
    );

    await connection.execute(
      `
        UPDATE refresh_tokens
        SET replaced_by_token_id = ?
        WHERE id = ?
      `,
      [
        newTokenId,
        input.currentTokenId,
      ],
    );

    await connection.commit();

    return newTokenId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

