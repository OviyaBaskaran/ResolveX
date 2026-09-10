import type { NextFunction, Request, Response } from "express";
import { verifyPlatformAccessToken } from "../services/platform-auth.service.js";

export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: "Platform authentication required", code: "PLATFORM_UNAUTHENTICATED" });
    return;
  }

  try {
    req.platformAdmin = verifyPlatformAccessToken(token);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired platform access token", code: "INVALID_PLATFORM_TOKEN" });
  }
};
