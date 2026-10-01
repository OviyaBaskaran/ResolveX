import type {
  Request,
  Response,
} from "express";

import {
  updateOrganizationStatusSchema,
} from "./platform-organizations.schema.js";

import {
  getOrganizations,
  changeOrganizationStatus,
  OrganizationStatusError,
} from "./platform-organizations.service.js";

export async function getOrganizationsController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const result =
      await getOrganizations();

    res.status(200).json({
      success: true,
      message:
        "Organizations retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch organizations:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}

export async function updateOrganizationStatusController(
  req: Request,
  res: Response,
): Promise<void> {
  const organizationId =
    Number(req.params.organizationId);

  if (
    !Number.isSafeInteger(
      organizationId,
    ) ||
    organizationId <= 0
  ) {
    res.status(400).json({
      success: false,
      message:
        "Invalid organization ID",
    });

    return;
  }

  const validationResult =
    updateOrganizationStatusSchema.safeParse(
      req.body,
    );

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors:
        validationResult.error.issues,
    });

    return;
  }

  if (
    req.platformAdminId === undefined
  ) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return;
  }

  try {
    await changeOrganizationStatus({
      organizationId,
      status:
        validationResult.data.status,
      platformAdminId:
        req.platformAdminId,
    });

    res.status(200).json({
      success: true,
      message:
        "Organization status updated successfully",
    });
  } catch (error: unknown) {
    if (
      error instanceof
      OrganizationStatusError
    ) {
      res.status(
        error.statusCode,
      ).json({
        success: false,
        message:
          error.message,
      });

      return;
    }

    console.error(
      "Organization status update failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}