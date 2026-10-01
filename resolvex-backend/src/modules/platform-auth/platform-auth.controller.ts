import type { Request, Response } from "express";

import { platformLoginSchema } from "./platform-auth.schema.js";
import {
  loginPlatformAdmin,
  PlatformAuthError,
} from "./platform-auth.service.js";

export async function loginPlatformAdminController(
  req: Request,
  res: Response,
): Promise<void> {
  const validationResult = platformLoginSchema.safeParse(req.body);

  if (!validationResult.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationResult.error.issues,
    });

    return;
  }

  try {
    const result = await loginPlatformAdmin(
      validationResult.data,
    );

    res.status(200).json({
      success: true,
      message: "Platform admin login successful",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof PlatformAuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });

      return;
    }

    console.error("Platform admin login failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}