import type { RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

import pool from "../../config/database.js";

type IdRow = RowDataPacket & {
  id: number;
};

export async function createOrganization(
  connection: PoolConnection,
  input: {
    code: string;
    name: string;
    timezone: string;
    contactEmail: string;
    contactPhone?: string;
  },
): Promise<number> {
  const [result] = await connection.execute(
    `
      INSERT INTO organizations (
        code,
        name,
        status,
        timezone,
        contact_email,
        contact_phone
      )
      VALUES (?, ?, 'PENDING', ?, ?, ?)
    `,
    [
      input.code,
      input.name,
      input.timezone,
      input.contactEmail,
      input.contactPhone ?? null,
    ],
  );

  return Number(
    (result as { insertId: number }).insertId,
  );
}

export async function findOrganizationByCode(
  connection: PoolConnection,
  code: string,
): Promise<{ id: number } | null> {
  const [rows] = await connection.query<IdRow[]>(
    `
      SELECT id
      FROM organizations
      WHERE code = ?
      LIMIT 1
    `,
    [code],
  );

  const organization = rows[0];

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
  };
}

export async function findOrganizationByEmail(
  connection: PoolConnection,
  email: string,
): Promise<{ id: number } | null> {
  const [rows] = await connection.query<IdRow[]>(
    `
      SELECT id
      FROM organizations
      WHERE contact_email = ?
      LIMIT 1
    `,
    [email],
  );

  const organization = rows[0];

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
  };
}

export async function createRole(
  connection: PoolConnection,
  input: {
    organizationId: number;
    code:
      | "CUSTOMER"
      | "SUPPORT_AGENT"
      | "MANAGER"
      | "ORGANIZATION_ADMIN";
    name: string;
  },
): Promise<number> {
  const [result] = await connection.execute(
    `
      INSERT INTO roles (
        organization_id,
        code,
        name
      )
      VALUES (?, ?, ?)
    `,
    [
      input.organizationId,
      input.code,
      input.name,
    ],
  );

  return Number(
    (result as { insertId: number }).insertId,
  );
}

export async function createUser(
  connection: PoolConnection,
  input: {
    organizationId: number;
    roleId: number;
    name: string;
    email: string;
    passwordHash: string;
  },
): Promise<number> {
  const [result] = await connection.execute(
    `
      INSERT INTO users (
        organization_id,
        role_id,
        name,
        email,
        password_hash,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `,
    [
      input.organizationId,
      input.roleId,
      input.name,
      input.email,
      input.passwordHash,
    ],
  );

  return Number(
    (result as { insertId: number }).insertId,
  );
}

export async function findUserByEmail(
  connection: PoolConnection,
  organizationId: number,
  email: string,
): Promise<{ id: number } | null> {
  const [rows] = await connection.query<IdRow[]>(
    `
      SELECT id
      FROM users
      WHERE organization_id = ?
        AND email = ?
      LIMIT 1
    `,
    [organizationId, email],
  );

  const user = rows[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
  };
}

export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}