import type { RowDataPacket } from "mysql2";

import pool from "../../config/database.js";

export type OrganizationStatus =
  | "PENDING"
  | "ACTIVE"
  | "DISABLED";

export type OrganizationListItem = {
  id: number;
  code: string;
  name: string;
  status: OrganizationStatus;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationRow = RowDataPacket & {
  id: number;
  code: string;
  name: string;
  status: OrganizationStatus;
  timezone: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: Date;
  updated_at: Date;
};

type OrganizationStatusRow =
  RowDataPacket & {
    id: number;
    status: OrganizationStatus;
  };

export async function findAllOrganizations(): Promise<
  OrganizationListItem[]
> {
  const [rows] =
    await pool.query<OrganizationRow[]>(
      `
        SELECT
          id,
          code,
          name,
          status,
          timezone,
          contact_email,
          contact_phone,
          created_at,
          updated_at
        FROM organizations
        ORDER BY created_at DESC
      `,
    );

  return rows.map((organization) => ({
    id: organization.id,
    code: organization.code,
    name: organization.name,
    status: organization.status,
    timezone: organization.timezone,
    contactEmail:
      organization.contact_email,
    contactPhone:
      organization.contact_phone,
    createdAt:
      organization.created_at,
    updatedAt:
      organization.updated_at,
  }));
}

export async function findOrganizationStatus(
  organizationId: number,
): Promise<OrganizationStatusRow | null> {
  const [rows] =
    await pool.query<
      OrganizationStatusRow[]
    >(
      `
        SELECT
          id,
          status
        FROM organizations
        WHERE id = ?
        LIMIT 1
      `,
      [organizationId],
    );

  return rows[0] ?? null;
}

export async function updateOrganizationStatus(
  input: {
    organizationId: number;
    status:
      | "ACTIVE"
      | "DISABLED";
    platformAdminId: number;
  },
): Promise<void> {
  if (input.status === "ACTIVE") {
    await pool.execute(
      `
        UPDATE organizations
        SET
          status = 'ACTIVE',
          approved_by_platform_admin_id = ?,
          approved_at = CURRENT_TIMESTAMP,
          disabled_at = NULL
        WHERE id = ?
      `,
      [
        input.platformAdminId,
        input.organizationId,
      ],
    );

    return;
  }

  await pool.execute(
    `
      UPDATE organizations
      SET
        status = 'DISABLED',
        disabled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [
      input.organizationId,
    ],
  );
}