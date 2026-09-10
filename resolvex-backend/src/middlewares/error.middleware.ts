import type { ErrorRequestHandler, RequestHandler } from "express";

type HttpError = Error & { status?: number; code?: string; type?: string };

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, code: "ROUTE_NOT_FOUND" });
};

export const errorHandler: ErrorRequestHandler = (error: HttpError, _req, res, _next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ success: false, message: "File must not exceed 50 MB", code: "FILE_TOO_LARGE" });
    return;
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({ success: false, message: "Unsupported upload", code: "INVALID_UPLOAD" });
    return;
  }
  if (error.type === "entity.too.large") {
    res.status(413).json({ success: false, message: "Request body is too large", code: "PAYLOAD_TOO_LARGE" });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(error.status ?? 500).json({ success: false, message: "Internal server error", code: error.code ?? "INTERNAL_SERVER_ERROR" });
};
