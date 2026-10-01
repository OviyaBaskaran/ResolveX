import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";

export type PlatformAccessTokenPayload = {
  sub: string;
  type: "PLATFORM_ADMIN";
};

export function generatePlatformAccessToken(
  adminId: number,
): string {
  const payload: PlatformAccessTokenPayload = {
    sub: String(adminId),
    type: "PLATFORM_ADMIN",
  };

  return jwt.sign(
    payload,
    env.jwt.accessSecret,
    {
      expiresIn:
        env.jwt.accessExpiresIn as SignOptions["expiresIn"] & {},
    },
  );
}

export function verifyPlatformAccessToken(
  token: string,
): PlatformAccessTokenPayload {
  const decoded = jwt.verify(
    token,
    env.jwt.accessSecret,
  );

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    decoded.type !== "PLATFORM_ADMIN" ||
    typeof decoded.sub !== "string"
  ) {
    throw new Error("Invalid platform access token");
  }

  return {
    sub: decoded.sub,
    type: "PLATFORM_ADMIN",
  };
}