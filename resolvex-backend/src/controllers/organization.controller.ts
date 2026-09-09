import type { Request, Response } from "express";
import { getOrganizationById, updateOrganizationName } from "../services/organization.service.js";
import { updateOrganizationSchema } from "../validations/organization.validation.js";

export const getCurrentOrganization = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const organization = await getOrganizationById(req.user.organizationId);

  if (!organization) {
    res.status(404).json({ success: false, message: "Organization not found", code: "ORGANIZATION_NOT_FOUND" });
    return;
  }

  res.status(200).json({ success: true, data: { organization } });
};

export const updateCurrentOrganization = async (req: Request, res: Response): Promise<void> => {
  const result = updateOrganizationSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    await updateOrganizationName(req.user.organizationId, result.data.name);
    const organization = await getOrganizationById(req.user.organizationId);
    res.status(200).json({ success: true, message: "Organization updated", data: { organization } });
  } catch (error) {
    if (error instanceof Error && error.message === "ORGANIZATION_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Organization not found", code: "ORGANIZATION_NOT_FOUND" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};