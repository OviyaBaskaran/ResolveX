import bcrypt from "bcrypt";

import type { LoginInput } from "./auth.schema.js";

import {
  createRefreshToken,
  findRefreshToken,
  findUserForLogin,
  rotateRefreshToken,
  updateLastLoginAt,
} from "./auth.repository.js";

import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "./auth.tokens.js";

type RefreshAccessTokenInput = {
  refreshToken: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class RefreshTokenError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "RefreshTokenError";
  }
}

export async function login(
  input: LoginInput,
) {
  const organizationCode =
    input.organizationCode
      .trim()
      .toUpperCase();

  const email =
    input.email
      .trim()
      .toLowerCase();

  const user =
    await findUserForLogin(
      organizationCode,
      email,
    );

  /*
   * Do not reveal whether the organization,
   * email, or password was incorrect.
   */
  if (!user) {
    throw new AuthenticationError(
      "Invalid organization code, email, or password",
    );
  }

  if (
    user.organization_status !==
    "ACTIVE"
  ) {
    throw new AuthenticationError(
      "Organization is not active",
    );
  }

  if (
    user.user_status !==
    "ACTIVE"
  ) {
    throw new AuthenticationError(
      "User account is disabled",
    );
  }

  const passwordMatches =
    await bcrypt.compare(
      input.password,
      user.password_hash,
    );

  if (!passwordMatches) {
    throw new AuthenticationError(
      "Invalid organization code, email, or password",
    );
  }

  await updateLastLoginAt(
    user.user_id,
  );

  const accessToken =
    generateAccessToken({
      userId: user.user_id,
      organizationId:
        user.organization_id,
      role: user.role_code,
    });

  const refreshToken =
    generateRefreshToken();

  const refreshTokenHash =
    hashRefreshToken(
      refreshToken,
    );

  const expiresAt =
    getRefreshTokenExpiry();

  await createRefreshToken({
    userId: user.user_id,
    organizationId:
      user.organization_id,
    tokenHash:
      refreshTokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,

    user: {
      id: user.user_id,
      name: user.user_name,
      email: user.user_email,

      organizationId:
        user.organization_id,

      organizationCode:
        user.organization_code,

      role: {
        id: user.role_id,
        code: user.role_code,
        name: user.role_name,
      },

      mustChangePassword:
        Boolean(
          user.must_change_password,
        ),
    },
  };
}

export async function refreshAccessToken(
  input: RefreshAccessTokenInput,
) {
  const tokenHash =
    hashRefreshToken(
      input.refreshToken,
    );

  const storedToken =
    await findRefreshToken(
      tokenHash,
    );

  if (!storedToken) {
    throw new RefreshTokenError(
      "Invalid refresh token",
    );
  }

  if (storedToken.revoked_at) {
    throw new RefreshTokenError(
      "Refresh token has been revoked",
    );
  }

  if (
    new Date(
      storedToken.expires_at,
    ).getTime() <= Date.now()
  ) {
    throw new RefreshTokenError(
      "Refresh token has expired",
    );
  }

  if (
    storedToken.organization_status !==
    "ACTIVE"
  ) {
    throw new RefreshTokenError(
      "Organization is not active",
    );
  }

  if (
    storedToken.user_status !==
    "ACTIVE"
  ) {
    throw new RefreshTokenError(
      "User account is disabled",
    );
  }

  const accessToken =
    generateAccessToken({
      userId:
        storedToken.user_id,

      organizationId:
        storedToken.organization_id,

      role:
        storedToken.role_code,
    });

  const newRefreshToken =
    generateRefreshToken();

  const newRefreshTokenHash =
    hashRefreshToken(
      newRefreshToken,
    );

  const expiresAt =
    getRefreshTokenExpiry();

  await rotateRefreshToken({
    currentTokenId:
      storedToken.id,

    userId:
      storedToken.user_id,

    organizationId:
      storedToken.organization_id,

    newTokenHash:
      newRefreshTokenHash,

    expiresAt,

    userAgent:
      input.userAgent,

    ipAddress:
      input.ipAddress,
  });

  return {
    accessToken,

    refreshToken:
      newRefreshToken,

    user: {
      id:
        storedToken.user_id,

      name:
        storedToken.user_name,

      email:
        storedToken.user_email,

      organizationId:
        storedToken.organization_id,

      organizationCode:
        storedToken.organization_code,

      role: {
        id:
          storedToken.role_id,

        code:
          storedToken.role_code,

        name:
          storedToken.role_name,
      },
    },
  };
}