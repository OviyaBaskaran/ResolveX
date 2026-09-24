import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../shared/errors/app-error.js";
import { ERROR_CODES } from "../shared/errors/error-codes.js";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "body";

        if (!errors[field]) {
          errors[field] = [];
        }

        errors[field].push(issue.message);
      }

      next(
        new AppError(
          400,
          "Validation failed",
          ERROR_CODES.VALIDATION_ERROR,
          errors,
        ),
      );

      return;
    }

    req.body = result.data;
    next();
  };
}