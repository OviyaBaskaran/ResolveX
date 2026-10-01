import type { Request, Response } from "express";

import {
  organizationRegistrationSchema,
} from "./organizations.schema.js";

import {
  OrganizationRegistrationError,
  registerOrganization,
} from "./organizations.service.js";

export async function registerOrganizationController(
  req: Request,
  res: Response,
): Promise<void> {
  const validationResult =
    organizationRegistrationSchema.safeParse(
      req.body,
    );

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.error.issues,
    });

    return;
  }

  try {
    const result = await registerOrganization(
      validationResult.data,
    );

    res.status(201).json({
      success: true,
      message: "Organization registered successfully",
      data: result,
    });
  } catch (error: unknown) {
    if (
      error instanceof OrganizationRegistrationError
    ) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error(
      "Organization registration failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}