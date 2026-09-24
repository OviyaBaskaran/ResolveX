import type { Request, Response } from "express";
import { AppError } from "../shared/errors/app-error.js";
import { ERROR_CODES } from "../shared/errors/error-codes.js";

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: (error?: unknown) => void,
): void {
  next(
    new AppError(
      404,
      `Route not found: ${req.method} ${req.originalUrl}`,
      ERROR_CODES.NOT_FOUND,
    ),
  );
}