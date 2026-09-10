import type { NextFunction, Request, Response } from "express";

type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();

/** A lightweight first-line throttle for credential endpoints. Use a shared store when horizontally scaling. */
export const credentialRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = `${req.path}:${req.ip}`;
  const current = attempts.get(key);
  const attempt = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + 15 * 60 * 1000 }
    : current;

  attempt.count += 1;
  attempts.set(key, attempt);

  if (attempt.count > 10) {
    res.setHeader("Retry-After", Math.ceil((attempt.resetAt - now) / 1000));
    res.status(429).json({ success: false, message: "Too many attempts. Please try again later.", code: "RATE_LIMITED" });
    return;
  }

  next();
};
