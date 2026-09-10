import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { env } from "../config/env.js";
import type { PlatformAdmin, PlatformTokenPayload } from "../types/platform-auth.js";

type PlatformLoginInput = {
  email: string;
  password: string;
};

const createPlatformAccessToken = (admin: PlatformAdmin): string => {
  const payload: PlatformTokenPayload = {
    sub: String(admin.id),
    name: admin.name,
    email: admin.email,
    tokenType: "PLATFORM_ADMIN"
  };

  return jwt.sign(payload, env.auth.accessTokenSecret, {
    expiresIn: env.auth.accessTokenExpiresInSeconds
  });
};

export const loginPlatformAdmin = async (input: PlatformLoginInput): Promise<{ admin: PlatformAdmin; accessToken: string }> => {
  const [rows] = await pool.query(
    `
      SELECT id, name, email, password_hash AS passwordHash, status
      FROM platform_admins
      WHERE email = ?
      LIMIT 1
    `,
    [input.email.toLowerCase()]
  );

  const admin = (rows as { id: number; name: string; email: string; passwordHash: string; status: string }[])[0];
  if (!admin || admin.status !== "ACTIVE" || !(await bcrypt.compare(input.password, admin.passwordHash))) {
    throw new Error("INVALID_PLATFORM_CREDENTIALS");
  }

  await pool.query("UPDATE platform_admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [admin.id]);

  const platformAdmin: PlatformAdmin = { id: admin.id, name: admin.name, email: admin.email };
  return { admin: platformAdmin, accessToken: createPlatformAccessToken(platformAdmin) };
};

export const verifyPlatformAccessToken = (token: string): PlatformAdmin => {
  const payload = jwt.verify(token, env.auth.accessTokenSecret) as PlatformTokenPayload;
  if (payload.tokenType !== "PLATFORM_ADMIN") throw new Error("INVALID_PLATFORM_TOKEN");
  return { id: Number(payload.sub), name: payload.name, email: payload.email };
};
