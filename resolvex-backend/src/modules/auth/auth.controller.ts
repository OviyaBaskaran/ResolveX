import type {
  Request,
  Response,
} from "express";

import { loginSchema } from "./auth.schema.js";

import { env } from "../../config/env.js";

import {
  AuthenticationError,
  RefreshTokenError,
  login,
  refreshAccessToken,
} from "./auth.service.js";

const REFRESH_TOKEN_COOKIE =
  "resolvex_refresh_token";

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:
    env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
};

function getRefreshTokenCookieMaxAge(): number {
  const expiresIn =
    env.jwt.refreshExpiresIn;

  const match =
    /^(\d+)([dhm])$/.exec(
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
    return (
      value *
      24 *
      60 *
      60 *
      1000
    );
  }

  if (unit === "h") {
    return (
      value *
      60 *
      60 *
      1000
    );
  }

  return (
    value *
    60 *
    1000
  );
}

export async function loginController(
  req: Request,
  res: Response,
): Promise<void> {
  const validationResult =
    loginSchema.safeParse(
      req.body,
    );

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors:
        validationResult.error.issues,
    });

    return;
  }

  try {
    const result =
      await login(
        validationResult.data,
      );

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge:
          getRefreshTokenCookieMaxAge(),
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken:
          result.accessToken,

        user:
          result.user,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof
      AuthenticationError
    ) {
      res.status(
        error.statusCode,
      ).json({
        success: false,
        message:
          error.message,
      });

      return;
    }

    console.error(
      "Organization login failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}

export async function refreshController(
  req: Request,
  res: Response,
): Promise<void> {
  const refreshToken =
    req.cookies[
      REFRESH_TOKEN_COOKIE
    ];

  if (
    typeof refreshToken !==
      "string" ||
    refreshToken.length === 0
  ) {
    res.status(401).json({
      success: false,
      message:
        "Refresh token is missing",
    });

    return;
  }

  try {
    const result =
      await refreshAccessToken({
        refreshToken,

        userAgent:
          req.get("user-agent") ??
          undefined,

        ipAddress:
          req.ip,
      });

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      {
        ...REFRESH_TOKEN_COOKIE_OPTIONS,
        maxAge:
          getRefreshTokenCookieMaxAge(),
      },
    );

    res.status(200).json({
      success: true,
      message:
        "Token refreshed successfully",
      data: {
        accessToken:
          result.accessToken,

        user:
          result.user,
      },
    });
  } catch (error: unknown) {
    if (
      error instanceof
      RefreshTokenError
    ) {
      res.status(
        error.statusCode,
      ).json({
        success: false,
        message:
          error.message,
      });

      return;
    }

    console.error(
      "Refresh token failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}