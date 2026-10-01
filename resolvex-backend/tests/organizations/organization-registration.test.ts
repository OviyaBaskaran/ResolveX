import request from "supertest";

import app from "../../src/app.js";
import pool from "../../src/config/database.js";

type OrganizationRow = {
  id: number;
};

async function deleteTestOrganization(
  code: string,
): Promise<void> {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM organizations
      WHERE code = ?
      LIMIT 1
    `,
    [code],
  );

  const organizations = rows as OrganizationRow[];

  const organization = organizations[0];

  if (!organization) {
    return;
  }

  const organizationId = organization.id;

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

describe("Organization Registration", () => {
  const testOrganization = {
    code: "TEST_ORG",
    name: "Test Organization",
    timezone: "Asia/Kolkata",
    contactEmail: "test-org@resolvex.test",
    contactPhone: "9876543210",
    adminName: "Test Admin",
    adminEmail: "test-admin@resolvex.test",
    adminPassword: "TestPassword@123",
  };

  beforeAll(async () => {
    await deleteTestOrganization(
      testOrganization.code,
    );

    await deleteTestOrganization(
      "PASSWORD_TEST_ORG",
    );

    await deleteTestOrganization(
      "ROLE_TEST_ORG",
    );

    await deleteTestOrganization(
      "ADMIN_TEST_ORG",
    );

    await deleteTestOrganization(
      "ANOTHER_TEST_ORG",
    );
  });

  afterAll(async () => {
    await deleteTestOrganization(
      testOrganization.code,
    );

    await deleteTestOrganization(
      "PASSWORD_TEST_ORG",
    );

    await deleteTestOrganization(
      "ROLE_TEST_ORG",
    );

    await deleteTestOrganization(
      "ADMIN_TEST_ORG",
    );

    await deleteTestOrganization(
      "ANOTHER_TEST_ORG",
    );
  });

  it("should register a new organization successfully", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send(testOrganization);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.organization).toEqual(
      expect.objectContaining({
        code: "TEST_ORG",
        name: "Test Organization",
        status: "PENDING",
      }),
    );

    expect(response.body.data.adminUser).toEqual(
      expect.objectContaining({
        name: "Test Admin",
        email: "test-admin@resolvex.test",
        role: "ORGANIZATION_ADMIN",
      }),
    );

    expect(
      response.body.data.organization.id,
    ).toEqual(expect.any(Number));

    expect(
      response.body.data.adminUser.id,
    ).toEqual(expect.any(Number));
  });

  it("should reject a duplicate organization code", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send(testOrganization);

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      success: false,
      message: "Organization code already exists",
    });
  });

  it("should reject a duplicate organization contact email", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send({
        ...testOrganization,
        code: "ANOTHER_TEST_ORG",
      });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      success: false,
      message:
        "Organization contact email already exists",
    });
  });

  it("should reject an invalid request body", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send({
        code: "",
        name: "",
        timezone: "",
        contactEmail: "invalid-email",
        adminName: "",
        adminEmail: "invalid-email",
        adminPassword: "",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Validation failed",
    );

    expect(response.body.errors).toEqual(
      expect.any(Array),
    );
  });

  it("should not return the admin password in the response", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send({
        ...testOrganization,
        code: "PASSWORD_TEST_ORG",
        contactEmail: "password-test@resolvex.test",
        adminEmail: "password-admin@resolvex.test",
      });

    expect(response.status).toBe(201);

    expect(
      response.body.data.adminUser.password,
    ).toBeUndefined();

    expect(
      response.body.data.adminUser.passwordHash,
    ).toBeUndefined();
  });

  it("should create exactly four organization roles", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send({
        ...testOrganization,
        code: "ROLE_TEST_ORG",
        contactEmail: "role-test@resolvex.test",
        adminEmail: "role-admin@resolvex.test",
      });

    expect(response.status).toBe(201);

    const organizationId =
      response.body.data.organization.id;

    const [rows] = await pool.query(
      `
        SELECT code
        FROM roles
        WHERE organization_id = ?
        ORDER BY code
      `,
      [organizationId],
    );

    expect(rows).toHaveLength(4);

expect(
  (rows as Array<{ code: string }>).map(
    (role) => role.code,
  ),
).toEqual(
  expect.arrayContaining([
    "CUSTOMER",
    "SUPPORT_AGENT",
    "MANAGER",
    "ORGANIZATION_ADMIN",
  ]),
);
  });

  it("should create the organization admin with the correct role", async () => {
    const response = await request(app)
      .post("/api/v1/organizations/register")
      .send({
        ...testOrganization,
        code: "ADMIN_TEST_ORG",
        contactEmail: "admin-test@resolvex.test",
        adminEmail: "organization-admin@resolvex.test",
      });

    expect(response.status).toBe(201);

    const organizationId =
      response.body.data.organization.id;

    const [rows] = await pool.query(
      `
        SELECT
          u.name,
          u.email,
          u.password_hash,
          r.code AS role_code
        FROM users u
        INNER JOIN roles r
          ON r.organization_id = u.organization_id
         AND r.id = u.role_id
        WHERE u.organization_id = ?
      `,
      [organizationId],
    );

    const users = rows as Array<{
      name: string;
      email: string;
      password_hash: string;
      role_code: string;
    }>;

    expect(users).toHaveLength(1);

    const user = users[0];

    expect(user).toBeDefined();

    if (!user) {
      throw new Error(
        "Expected organization admin user to exist",
      );
    }

    expect(user).toEqual(
      expect.objectContaining({
        name: "Test Admin",
        email: "organization-admin@resolvex.test",
        role_code: "ORGANIZATION_ADMIN",
      }),
    );

    expect(user.password_hash).not.toBe(
      testOrganization.adminPassword,
    );

    expect(user.password_hash).toMatch(/^\$2[aby]\$/);
  });
});