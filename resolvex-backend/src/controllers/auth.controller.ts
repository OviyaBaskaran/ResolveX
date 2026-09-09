import type { Request, Response } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validations/auth.validation.js";
import { loginUser, refreshUserSession, registerUser, requestPasswordReset, resetPassword, revokeRefreshToken } from "../services/auth.service.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth"
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const auth = await loginUser(result.data);

    res.cookie("refreshToken", auth.refreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: auth.user, accessToken: auth.accessToken }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ success: false, message: "Invalid email or password", code: "INVALID_CREDENTIALS" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token required", code: "MISSING_REFRESH_TOKEN" });
    return;
  }

  try {
    const auth = await refreshUserSession(refreshToken);
    res.cookie("refreshToken", auth.refreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: { user: auth.user, accessToken: auth.accessToken }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
      res.status(401).json({ success: false, message: "Invalid or expired refresh token", code: "INVALID_REFRESH_TOKEN" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie("refreshToken", { path: "/api/v1/auth" });
  res.status(200).json({ success: true, message: "Logout successful" });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: result.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const auth = await registerUser(result.data);
    res.cookie("refreshToken", auth.refreshToken, refreshCookieOptions);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: auth.user, accessToken: auth.accessToken }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      res.status(409).json({ success: false, message: "Email already exists in this organization", code: "EMAIL_ALREADY_EXISTS" });
      return;
    }

    if (error instanceof Error && error.message === "ORGANIZATION_NOT_FOUND") {
      res.status(404).json({ success: false, message: "Organization not found", code: "ORGANIZATION_NOT_FOUND" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const result = forgotPasswordSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }

  const token = await requestPasswordReset(result.data);
  const response: { success: true; message: string; data?: { resetToken: string } } = {
    success: true,
    message: "If the account exists, password reset instructions will be sent"
  };

  if (token && process.env.NODE_ENV !== "production") {
    response.data = { resetToken: token };
  }

  res.status(200).json(response);
};

export const completePasswordReset = async (req: Request, res: Response): Promise<void> => {
  const result = resetPasswordSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.flatten().fieldErrors });
    return;
  }

  try {
    await resetPassword(result.data.token, result.data.password);
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      res.status(400).json({ success: false, message: "Invalid or expired reset token", code: "INVALID_RESET_TOKEN" });
      return;
    }

    res.status(500).json({ success: false, message: "Internal server error", code: "INTERNAL_SERVER_ERROR" });
  }
};