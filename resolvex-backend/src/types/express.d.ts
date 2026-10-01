declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        organizationId: number;
        role: string;
      };

      platformAdminId?: number;

      requestId: string;
    }
  }
}

export {};