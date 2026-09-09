import type { Request, Response } from "express";
import { addMember, assignManager, createTeam, getTeamById, listMembers, listTeams, removeMember } from "../services/team.service.js";
import { assignManagerSchema, createTeamSchema, teamMemberSchema } from "../validations/team.validation.js";

const idFromParams = (value: string | string[] | undefined): number => Number(Array.isArray(value) ? value[0] : value);

export const create = async (req: Request, res: Response): Promise<void> => {
  const result = createTeamSchema.safeParse(req.body);
  if (!result.success || !req.user) {
    res.status(result.success ? 401 : 400).json({ success: false, message: result.success ? "Authentication required" : "Validation failed", code: result.success ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  try {
    const team = await createTeam(result.data, req.user.organizationId);
    res.status(201).json({ success: true, message: "Team created", data: { team } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["MANAGER_NOT_FOUND", "TEAM_ALREADY_EXISTS"].includes(code)) {
      res.status(code === "TEAM_ALREADY_EXISTS" ? 409 : 404).json({ success: false, message: code === "TEAM_ALREADY_EXISTS" ? "Team already exists" : "Manager not found in this organization", code });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const list = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }
  res.status(200).json({ success: true, data: { teams: await listTeams(req.user.organizationId) } });
};

export const setManager = async (req: Request, res: Response): Promise<void> => {
  const result = assignManagerSchema.safeParse(req.body);
  const teamId = idFromParams(req.params.teamId);
  if (!result.success || !Number.isSafeInteger(teamId) || !req.user) {
    res.status(!req.user ? 401 : 400).json({ success: false, message: !req.user ? "Authentication required" : "Validation failed", code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  try {
    await assignManager(teamId, req.user.organizationId, result.data.managerId);
    res.status(200).json({ success: true, message: "Team manager updated" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["TEAM_NOT_FOUND", "MANAGER_NOT_FOUND"].includes(code)) {
      res.status(404).json({ success: false, message: code === "TEAM_NOT_FOUND" ? "Team not found" : "Manager not found in this organization", code });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const add = async (req: Request, res: Response): Promise<void> => {
  const result = teamMemberSchema.safeParse(req.body);
  const teamId = idFromParams(req.params.teamId);
  if (!result.success || !Number.isSafeInteger(teamId) || !req.user) {
    res.status(!req.user ? 401 : 400).json({ success: false, message: !req.user ? "Authentication required" : "Validation failed", code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  try {
    await addMember(teamId, req.user.organizationId, result.data.userId);
    res.status(201).json({ success: true, message: "Team member added" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (["TEAM_NOT_FOUND", "USER_NOT_FOUND", "MEMBER_ALREADY_EXISTS"].includes(code)) {
      res.status(code === "MEMBER_ALREADY_EXISTS" ? 409 : 404).json({ success: false, message: code === "TEAM_NOT_FOUND" ? "Team not found" : code === "USER_NOT_FOUND" ? "User not found in this organization" : "User is already a team member", code });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  const teamId = idFromParams(req.params.teamId);
  const userId = idFromParams(req.params.userId);
  if (!req.user || !Number.isSafeInteger(teamId) || !Number.isSafeInteger(userId)) {
    res.status(!req.user ? 401 : 400).json({ success: false, message: !req.user ? "Authentication required" : "Validation failed", code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR" });
    return;
  }
  try {
    await removeMember(teamId, req.user.organizationId, userId);
    res.status(200).json({ success: true, message: "Team member removed" });
  } catch (error) {
    if (error instanceof Error && error.message === "MEMBER_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Team member not found", code: "MEMBER_NOT_FOUND" });
      return;
    }
    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const members = async (req: Request, res: Response): Promise<void> => {
  const teamId = idFromParams(req.params.teamId);

  if (!req.user || !Number.isSafeInteger(teamId)) {
    res.status(!req.user ? 401 : 400).json({
      success: false,
      message: !req.user ? "Authentication required" : "Validation failed",
      code: !req.user ? "UNAUTHENTICATED" : "VALIDATION_ERROR"
    });
    return;
  }

  const team = await getTeamById(teamId, req.user.organizationId);

  if (!team) {
    res.status(404).json({ success: false, message: "Team not found", code: "TEAM_NOT_FOUND" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { members: await listMembers(teamId, req.user.organizationId) }
  });
};