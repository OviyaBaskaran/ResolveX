import type { ErrorRequestHandler } from "express";
import { AppError } from "../shared/errors/app-error.js";
import { ERROR_CODES } from "../shared/errors/error-codes.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.errors ? { errors: error.errors } : {}),
    });

    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
  });
};