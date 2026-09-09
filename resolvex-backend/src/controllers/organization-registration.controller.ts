import type { Request, Response } from "express";
import { registerOrganizationSchema } from "../validations/organization.validation.js";
import { registerOrganization } from "../services/organization-registration.service.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = registerOrganizationSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }
  try {
    const admin = await registerOrganization(result.data);
    res.status(201).json({ success: true, message: "Organization registered", data: { organizationId: admin.organizationId, admin } });
  } catch (error) {
    if (error instanceof Error && error.message === "ORGANIZATION_ALREADY_EXISTS") {
      res.status(409).json({ success: false, message: "Organization slug or admin email already exists", code: "ORGANIZATION_ALREADY_EXISTS" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};