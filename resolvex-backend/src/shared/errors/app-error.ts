export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors: Record<string, string[]> | undefined;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}