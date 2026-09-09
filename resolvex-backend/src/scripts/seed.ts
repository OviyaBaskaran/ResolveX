import bcrypt from "bcrypt";
import pool from "../config/database.js";

const requiredSeedEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required seed environment variable: ${name}`);
  }

  return value;
};

const roles = [
  {
    name: "Customer",
    code: "CUSTOMER",
    description: "Customer who can create and track support tickets"
  },
  {
    name: "Support Agent",
    code: "SUPPORT_AGENT",
    description: "Support team member who handles customer tickets"
  },
  {
    name: "Manager",
    code: "MANAGER",
    description: "Manager who oversees support operations and team workload"
  },
  {
    name: "Organization Admin",
    code: "ORGANIZATION_ADMIN",
    description: "Administrator who manages the organization"
  }
];

const seed = async (): Promise<void> => {
  const organizationName = requiredSeedEnv("SEED_ORGANIZATION_NAME");
  const organizationSlug = requiredSeedEnv("SEED_ORGANIZATION_SLUG");
  const adminName = requiredSeedEnv("SEED_ADMIN_NAME");
  const adminEmail = requiredSeedEnv("SEED_ADMIN_EMAIL");
  const adminPassword = requiredSeedEnv("SEED_ADMIN_PASSWORD");

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // --------------------------------------------------
    // 1. Create or find organization
    // --------------------------------------------------

    const [existingOrganizations] = await connection.query(
      `
        SELECT id
        FROM organizations
        WHERE slug = ?
        LIMIT 1
      `,
      [organizationSlug]
    );

    const organizations = existingOrganizations as { id: number }[];

    let organizationId: number;

    if (organizations.length > 0) {
      const existingOrganization = organizations[0];

      if (!existingOrganization) {
        throw new Error("Organization was expected but was not found.");
      }

      organizationId = existingOrganization.id;

      console.log(`Organization already exists: ${organizationName}`);
    } else {
      const [result] = await connection.query(
        `
          INSERT INTO organizations (
            name,
            slug
          )
          VALUES (?, ?)
        `,
        [organizationName, organizationSlug]
      );

      const insertResult = result as { insertId: number };

      organizationId = insertResult.insertId;

      console.log(`Organization created: ${organizationName}`);
    }

    // --------------------------------------------------
    // 2. Create default roles
    // --------------------------------------------------

    for (const role of roles) {
      const [existingRoles] = await connection.query(
        `
          SELECT id
          FROM roles
          WHERE organization_id = ?
            AND code = ?
          LIMIT 1
        `,
        [organizationId, role.code]
      );

      const roleRows = existingRoles as { id: number }[];

      if (roleRows.length > 0) {
        console.log(`Role already exists: ${role.code}`);
        continue;
      }

      await connection.query(
        `
          INSERT INTO roles (
            organization_id,
            name,
            code,
            description
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          organizationId,
          role.name,
          role.code,
          role.description
        ]
      );

      console.log(`Role created: ${role.code}`);
    }

    // --------------------------------------------------
    // 3. Find Organization Admin role
    // --------------------------------------------------

    const [adminRoles] = await connection.query(
      `
        SELECT id
        FROM roles
        WHERE organization_id = ?
          AND code = 'ORGANIZATION_ADMIN'
        LIMIT 1
      `,
      [organizationId]
    );

    const adminRoleRows = adminRoles as { id: number }[];

    const adminRole = adminRoleRows[0];

    if (!adminRole) {
      throw new Error("Organization Admin role was not found.");
    }

    const adminRoleId = adminRole.id;

    // --------------------------------------------------
    // 4. Create initial admin user
    // --------------------------------------------------

    const [existingAdmins] = await connection.query(
      `
        SELECT id
        FROM users
        WHERE organization_id = ?
          AND email = ?
        LIMIT 1
      `,
      [organizationId, adminEmail]
    );

    const adminUsers = existingAdmins as { id: number }[];

    if (adminUsers.length > 0) {
      console.log(`Admin user already exists: ${adminEmail}`);
    } else {
      await connection.query(
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
          organizationId,
          adminRoleId,
          adminName,
          adminEmail,
          passwordHash
        ]
      );

      console.log(`Admin user created: ${adminEmail}`);
    }

    // --------------------------------------------------
    // 5. Commit transaction
    // --------------------------------------------------

    await connection.commit();

    console.log("Seed completed successfully.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});