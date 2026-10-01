import bcrypt from "bcrypt";

import {
  findPlatformAdminByEmail,
  updatePlatformAdminLastLogin,
} from "./platform-auth.repository.js";

import type { PlatformLoginInput } from "./platform-auth.schema.js";

import { generatePlatformAccessToken } from "../../shared/utils/jwt.js";

export class PlatformAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PlatformAuthError";
  }
}

export async function loginPlatformAdmin(
  input: PlatformLoginInput,
) {
  const email = input.email.trim().toLowerCase();

  const admin = await findPlatformAdminByEmail(email);

  if (!admin) {
    throw new PlatformAuthError(
      "Invalid email or password",
      401,
    );
  }

  if (admin.status !== "ACTIVE") {
    throw new PlatformAuthError(
      "Platform admin account is disabled",
      403,
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    admin.passwordHash,
  );

  if (!passwordMatches) {
    throw new PlatformAuthError(
      "Invalid email or password",
      401,
    );
  }

  await updatePlatformAdminLastLogin(admin.id);

  const accessToken = generatePlatformAccessToken(admin.id);

  return {
    accessToken,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
  };
}