import type { Request, Response } from "express";
import { loginPlatformAdmin } from "../services/platform-auth.service.js";
import { listPlatformOrganizations, updatePlatformOrganizationStatus } from "../services/platform.service.js";
import { platformLoginSchema, updateOrganizationStatusSchema } from "../validations/platform.validation.js";

const parseId = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

export const platformLogin = async (req: Request, res: Response): Promise<void> => {
  const result = platformLoginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }

  try {
    const auth = await loginPlatformAdmin(result.data);
    res.status(200).json({ success: true, message: "Platform login successful", data: auth });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PLATFORM_CREDENTIALS") {
      res.status(401).json({ success: false, message: "Invalid platform credentials", code: error.message });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const listOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await listPlatformOrganizations();
    res.status(200).json({ success: true, data: { organizations } });
  } catch {
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const updateOrganizationStatus = async (req: Request, res: Response): Promise<void> => {
  const organizationId = parseId(req.params.organizationId);
  const result = updateOrganizationStatusSchema.safeParse(req.body);
  if (!Number.isSafeInteger(organizationId) || organizationId <= 0 || !result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  try {
    await updatePlatformOrganizationStatus(organizationId, result.data.status);
    res.status(200).json({ success: true, message: "Organization status updated" });
  } catch (error) {
    if (error instanceof Error && error.message === "ORGANIZATION_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Organization not found", code: error.message });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};
