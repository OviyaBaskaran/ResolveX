import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

type AccessTokenPayload = {
  sub: string;
  organizationId: number;
  role: string;
  type: "ORG_ACCESS";
};

function isAccessTokenPayload(
  payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & AccessTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.organizationId === "number" &&
    typeof payload.role === "string" &&
    payload.type === "ORG_ACCESS"
  );
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorizationHeader = req.get("authorization");

  if (!authorizationHeader) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  const [scheme, token] =
    authorizationHeader.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });

    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      env.jwt.accessSecret,
    );

    if (!isAccessTokenPayload(decoded)) {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });

      return;
    }

    req.user = {
      id: Number(decoded.sub),
      organizationId: decoded.organizationId,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}