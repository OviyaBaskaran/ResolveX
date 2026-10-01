import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { OrganizationRole } from "../shared/constants/roles.js";

export function authorize(
  ...allowedRoles: OrganizationRole[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    if (!allowedRoles.includes(
      req.user.role as OrganizationRole,
    )) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });

      return;
    }

    next();
  };
}