import bcrypt from "bcrypt";

import {
  createOrganization,
  createRole,
  createUser,
  findOrganizationByCode,
  findOrganizationByEmail,
  getConnection,
} from "./organizations.repository.js";

import type {
  OrganizationRegistrationInput,
} from "./organizations.schema.js";

export class OrganizationRegistrationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrganizationRegistrationError";
  }
}

export async function registerOrganization(
  input: OrganizationRegistrationInput,
) {
  const code = input.code.trim().toUpperCase();

  const contactEmail = input.contactEmail
    .trim()
    .toLowerCase();

  const adminEmail = input.adminEmail
    .trim()
    .toLowerCase();

  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const existingOrganization =
      await findOrganizationByCode(
        connection,
        code,
      );

    if (existingOrganization) {
      throw new OrganizationRegistrationError(
        "Organization code already exists",
        409,
      );
    }

    const existingEmail =
      await findOrganizationByEmail(
        connection,
        contactEmail,
      );

    if (existingEmail) {
      throw new OrganizationRegistrationError(
        "Organization contact email already exists",
        409,
      );
    }

    const organizationId =
      await createOrganization(
        connection,
        {
          code,
          name: input.name.trim(),
          timezone: input.timezone.trim(),
          contactEmail,
          ...(input.contactPhone !== undefined && {
            contactPhone: input.contactPhone.trim(),
          }),
        },
      );

    const roles = {
      CUSTOMER: await createRole(connection, {
        organizationId,
        code: "CUSTOMER",
        name: "Customer",
      }),

      SUPPORT_AGENT: await createRole(connection, {
        organizationId,
        code: "SUPPORT_AGENT",
        name: "Support Agent",
      }),

      MANAGER: await createRole(connection, {
        organizationId,
        code: "MANAGER",
        name: "Manager",
      }),

      ORGANIZATION_ADMIN: await createRole(connection, {
        organizationId,
        code: "ORGANIZATION_ADMIN",
        name: "Organization Admin",
      }),
    };

    const passwordHash = await bcrypt.hash(
      input.adminPassword,
      12,
    );

    const adminUserId = await createUser(
      connection,
      {
        organizationId,
        roleId: roles.ORGANIZATION_ADMIN,
        name: input.adminName.trim(),
        email: adminEmail,
        passwordHash,
      },
    );

    await connection.commit();

    return {
      organization: {
        id: organizationId,
        code,
        name: input.name.trim(),
        status: "PENDING",
      },
      adminUser: {
        id: adminUserId,
        name: input.adminName.trim(),
        email: adminEmail,
        role: "ORGANIZATION_ADMIN",
      },
    };
  } catch (error: unknown) {
    await connection.rollback();

    if (error instanceof OrganizationRegistrationError) {
      throw error;
    }

    throw error;
  } finally {
    connection.release();
  }
}