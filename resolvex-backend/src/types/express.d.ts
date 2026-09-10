import type { AuthUser } from "./auth.js";
import type { PlatformAdmin } from "./platform-auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      platformAdmin?: PlatformAdmin;
    }
  }
}

export {};