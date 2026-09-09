import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/auth.service.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required", code: "UNAUTHENTICATED" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
      organizationId: payload.organizationId,
      roleId: payload.roleId,
      roleCode: payload.roleCode
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired access token", code: "INVALID_TOKEN" });
  }
};

export const requireRole = (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.roleCode)) {
      res.status(403).json({ success: false, message: "Insufficient permissions", code: "FORBIDDEN" });
      return;
    }

    next();
  };