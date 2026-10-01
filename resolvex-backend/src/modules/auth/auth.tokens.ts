import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";

import { env } from "../../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  organizationId: number;
  role: string;
  type: "ORG_ACCESS";
};

export function generateAccessToken(input: {
  userId: number;
  organizationId: number;
  role: string;
}): string {
  const payload: AccessTokenPayload = {
    sub: String(input.userId),
    organizationId: input.organizationId,
    role: input.role,
    type: "ORG_ACCESS",
  };

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn:
      env.jwt.accessExpiresIn as SignOptions["expiresIn"] & {},
  });
}

export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

export function hashRefreshToken(
  token: string,
): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getRefreshTokenExpiry(): Date {
  const expiresAt = new Date();

  const expiresIn = env.jwt.refreshExpiresIn;

  const match = /^(\d+)([dhm])$/.exec(
    expiresIn,
  );

  if (!match) {
    throw new Error(
      "Invalid REFRESH_TOKEN_EXPIRES_IN configuration",
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "d") {
    expiresAt.setDate(
      expiresAt.getDate() + value,
    );
  } else if (unit === "h") {
    expiresAt.setHours(
      expiresAt.getHours() + value,
    );
  } else {
    expiresAt.setMinutes(
      expiresAt.getMinutes() + value,
    );
  }

  return expiresAt;
}