import type { Request, Response } from "express";
import {
  createOrganizationUser,
  listOrganizationUsers,
  updateOrganizationUserRole,
  updateOrganizationUserStatus
} from "../services/user.service.js";
import { createUserSchema, updateUserRoleSchema, updateUserStatusSchema } from "../validations/user.validation.js";

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const result = createUserSchema.safeParse(req.body);

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
    const user = await createOrganizationUser(result.data, req.user.organizationId);
    res.status(201).json({ success: true, message: "User created", data: { user } });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({ success: false, message: "Email already exists in this organization", code: "EMAIL_ALREADY_EXISTS" });
      return;
    }

    if (error instanceof Error && error.message === "ROLE_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Role not found in this organization", code: "ROLE_NOT_FOUND" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  const users = await listOrganizationUsers(req.user.organizationId);
  res.status(200).json({ success: true, data: { users } });
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const result = updateUserStatusSchema.safeParse(req.body);
  const userId = Number(req.params.userId);

  if (!result.success || !Number.isSafeInteger(userId)) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  if (userId === req.user.id && result.data.status === "DISABLED") {
    res.status(400).json({ success: false, message: "You cannot disable your own account", code: "SELF_DEACTIVATION_NOT_ALLOWED" });
    return;
  }

  try {
    await updateOrganizationUserStatus(userId, req.user.organizationId, result.data.status);
    res.status(200).json({ success: true, message: "User status updated" });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      res.status(404).json({ success: false, message: "User not found", code: "USER_NOT_FOUND" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  const result = updateUserRoleSchema.safeParse(req.body);
  const userId = Number(req.params.userId);

  if (!result.success || !Number.isSafeInteger(userId)) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    await updateOrganizationUserRole(userId, req.user.organizationId, result.data.roleCode);
    res.status(200).json({ success: true, message: "User role updated" });
  } catch (error) {
    if (error instanceof Error && ["USER_NOT_FOUND", "ROLE_NOT_FOUND"].includes(error.message)) {
      res.status(404).json({ success: false, message: error.message === "ROLE_NOT_FOUND" ? "Role not found" : "User not found", code: error.message });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};