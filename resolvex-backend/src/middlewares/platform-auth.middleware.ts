import type { NextFunction, Request, Response } from "express";

import { verifyPlatformAccessToken } from "../shared/utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      platformAdminId?: number;
    }
  }
}

export function platformAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });

    return;
  }

  try {
    const payload = verifyPlatformAccessToken(token);

    const platformAdminId = Number(payload.sub);

    if (!Number.isSafeInteger(platformAdminId) || platformAdminId <= 0) {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });

      return;
    }

    req.platformAdminId = platformAdminId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}