import request from "supertest";
import type { RowDataPacket } from "mysql2";

import app from "../src/app.js";
import pool from "../src/config/database.js";
import { env } from "../src/config/env.js";

type OrganizationRow = RowDataPacket & {
  id: number;
  code: string;
  status:
    | "PENDING"
    | "ACTIVE"
    | "DISABLED";
  approved_by_platform_admin_id:
    | number
    | null;
  approved_at: Date | null;
  disabled_at: Date | null;
};

const TEST_ORGANIZATION = {
  code: "PLATFORM_TEST_ORG",
  name: "Platform Test Organization",
  timezone: "Asia/Kolkata",
  contactEmail: "platform-org@test.com",
  contactPhone: "9876543200",
  adminName: "Platform Test Admin",
  adminEmail: "platform-admin@test.com",
  adminPassword: "Password@123",
};

async function deleteTestOrganization(): Promise<void> {
  const [rows] =
    await pool.query<OrganizationRow[]>(
      `
        SELECT
          id,
          code,
          status,
          approved_by_platform_admin_id,
          approved_at,
          disabled_at
        FROM organizations
        WHERE code = ?
        LIMIT 1
      `,
      [TEST_ORGANIZATION.code],
    );

  const organization = rows[0];

  if (!organization) {
    return;
  }

  const organizationId =
    organization.id;

  await pool.query(
    `
      DELETE FROM refresh_tokens
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM password_reset_tokens
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM notifications
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_attachments
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_internal_notes
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_comments
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_status_history
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_assignment_history
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM ticket_sla
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM tickets
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM team_members
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM teams
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM audit_logs
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM users
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM roles
      WHERE organization_id = ?
    `,
    [organizationId],
  );

  await pool.query(
    `
      DELETE FROM organizations
      WHERE id = ?
    `,
    [organizationId],
  );
}

async function createTestOrganization(): Promise<number> {
  const response = await request(app)
    .post("/api/v1/organizations/register")
    .send(TEST_ORGANIZATION);

  expect(response.status).toBe(201);

  const [rows] =
    await pool.query<
      Array<
        RowDataPacket & {
          id: number;
        }
      >
    >(
      `
        SELECT id
        FROM organizations
        WHERE code = ?
        LIMIT 1
      `,
      [TEST_ORGANIZATION.code],
    );

  const organization = rows[0];

  if (!organization) {
    throw new Error(
      "Test organization was not created",
    );
  }

  return organization.id;
}

describe("Platform Organizations", () => {
  let accessToken: string;
  let organizationId: number;

  beforeAll(async () => {
    await deleteTestOrganization();

    const loginResponse =
      await request(app)
        .post(
          "/api/v1/platform/auth/login",
        )
        .send({
          email: env.platformAdmin.email,
          password:
            env.platformAdmin.password,
        });

    expect(loginResponse.status).toBe(
      200,
    );

    accessToken =
      loginResponse.body.data.accessToken;

    organizationId =
      await createTestOrganization();
  });

  afterAll(async () => {
    await deleteTestOrganization();
  });

  describe("GET /api/v1/platform/organizations", () => {
    it("should reject unauthenticated requests", async () => {
      const response = await request(app)
        .get(
          "/api/v1/platform/organizations",
        );

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message:
          "Authentication required",
      });
    });

    it("should reject an invalid access token", async () => {
      const response = await request(app)
        .get(
          "/api/v1/platform/organizations",
        )
        .set(
          "Authorization",
          "Bearer invalid-token",
        );

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message:
          "Invalid or expired access token",
      });
    });

    it("should retrieve organizations for an authenticated platform admin", async () => {
      const response = await request(app)
        .get(
          "/api/v1/platform/organizations",
        )
        .set(
          "Authorization",
          `Bearer ${accessToken}`,
        );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(
        true,
      );

      expect(response.body.message).toBe(
        "Organizations retrieved successfully",
      );

      expect(response.body.data).toEqual({
        organizations:
          expect.any(Array),
        total: expect.any(Number),
      });

      expect(
        response.body.data.organizations
          .length,
      ).toBe(
        response.body.data.total,
      );
    });
  });

  describe(
    "PATCH /api/v1/platform/organizations/:organizationId/status",
    () => {
      it("should reject unauthenticated requests", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
          success: false,
          message:
            "Authentication required",
        });
      });

      it("should reject an invalid access token", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            "Bearer invalid-token",
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
          success: false,
          message:
            "Invalid or expired access token",
        });
      });

      it("should reject an invalid organization ID", async () => {
        const response = await request(app)
          .patch(
            "/api/v1/platform/organizations/invalid/status",
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
          success: false,
          message:
            "Invalid organization ID",
        });
      });

      it("should reject an invalid status", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "INVALID",
          });

        expect(response.status).toBe(400);

        expect(response.body).toMatchObject({
          success: false,
          message: "Validation failed",
        });
      });

      it("should return 404 for a non-existent organization", async () => {
        const response = await request(app)
          .patch(
            "/api/v1/platform/organizations/999999999/status",
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(404);

        expect(response.body).toEqual({
          success: false,
          message:
            "Organization not found",
        });
      });

      it("should approve a pending organization", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
          success: true,
          message:
            "Organization status updated successfully",
        });
      });

      it("should persist approval metadata", async () => {
        const [rows] =
          await pool.query<
            OrganizationRow[]
          >(
            `
              SELECT
                id,
                code,
                status,
                approved_by_platform_admin_id,
                approved_at,
                disabled_at
              FROM organizations
              WHERE id = ?
              LIMIT 1
            `,
            [organizationId],
          );

        const organization = rows[0];

        expect(organization).toBeDefined();

        if (!organization) {
          throw new Error(
            "Organization was not found after approval",
          );
        }

        expect(
          organization.status,
        ).toBe("ACTIVE");

        expect(
          organization.approved_by_platform_admin_id,
        ).toBeGreaterThan(0);

        expect(
          organization.approved_at,
        ).not.toBeNull();

        expect(
          organization.disabled_at,
        ).toBeNull();
      });

      it("should reject activating an already active organization", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(409);

        expect(response.body).toEqual({
          success: false,
          message:
            "Organization is already ACTIVE",
        });
      });

      it("should disable an active organization", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "DISABLED",
          });

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
          success: true,
          message:
            "Organization status updated successfully",
        });
      });

      it("should persist disabled metadata", async () => {
        const [rows] =
          await pool.query<
            OrganizationRow[]
          >(
            `
              SELECT
                status,
                approved_by_platform_admin_id,
                approved_at,
                disabled_at
              FROM organizations
              WHERE id = ?
              LIMIT 1
            `,
            [organizationId],
          );

        const organization = rows[0];

        expect(organization).toBeDefined();

        if (!organization) {
          throw new Error(
            "Organization was not found after disabling",
          );
        }

        expect(
          organization.status,
        ).toBe("DISABLED");

        expect(
          organization.approved_by_platform_admin_id,
        ).toBeGreaterThan(0);

        expect(
          organization.approved_at,
        ).not.toBeNull();

        expect(
          organization.disabled_at,
        ).not.toBeNull();
      });

      it("should reject reactivating a disabled organization", async () => {
        const response = await request(app)
          .patch(
            `/api/v1/platform/organizations/${organizationId}/status`,
          )
          .set(
            "Authorization",
            `Bearer ${accessToken}`,
          )
          .send({
            status: "ACTIVE",
          });

        expect(response.status).toBe(409);

        expect(response.body).toEqual({
          success: false,
          message:
            "Disabled organization cannot be reactivated",
        });
      });
    },
  );
});