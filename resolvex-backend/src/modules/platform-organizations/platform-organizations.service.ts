import {
  findAllOrganizations,
  findOrganizationStatus,
  updateOrganizationStatus,
} from "./platform-organizations.repository.js";

export class OrganizationStatusError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "OrganizationStatusError";
  }
}

export async function getOrganizations() {
  const organizations =
    await findAllOrganizations();

  return {
    organizations,
    total: organizations.length,
  };
}

export async function changeOrganizationStatus(
  input: {
    organizationId: number;
    status:
      | "ACTIVE"
      | "DISABLED";
    platformAdminId: number;
  },
): Promise<void> {
  const organization =
    await findOrganizationStatus(
      input.organizationId,
    );

  if (!organization) {
    throw new OrganizationStatusError(
      "Organization not found",
      404,
    );
  }

  const currentStatus =
    organization.status;

  /*
   * A disabled organization cannot
   * currently be reactivated.
   */
  if (
    currentStatus === "DISABLED"
  ) {
    throw new OrganizationStatusError(
      "Disabled organization cannot be reactivated",
      409,
    );
  }

  /*
   * Prevent unnecessary status updates.
   */
  if (
    currentStatus === input.status
  ) {
    throw new OrganizationStatusError(
      `Organization is already ${input.status}`,
      409,
    );
  }

  /*
   * Valid transitions:
   *
   * PENDING → ACTIVE
   * PENDING → DISABLED
   * ACTIVE  → DISABLED
   */
  await updateOrganizationStatus(
    input,
  );
}