import express from "express";
import request from "supertest";

import { authorize } from "../../src/middlewares/authorize.middleware.js";

function createTestApp(
  role?: string,
) {
  const app = express();

  app.get(
    "/protected",
    (req, _res, next) => {
      if (role) {
        req.user = {
          id: 1,
          organizationId: 10,
          role,
        };
      }

      next();
    },
    authorize(
      "MANAGER",
      "ORGANIZATION_ADMIN",
    ),
    (_req, res) => {
      res.status(200).json({
        success: true,
        message: "Access granted",
      });
    },
  );

  return app;
}

describe("Authorization middleware", () => {
  it("returns 401 when user is not authenticated", async () => {
    const app = createTestApp();

    const response = await request(app)
      .get("/protected");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("returns 403 when user's role is not allowed", async () => {
    const app = createTestApp("CUSTOMER");

    const response = await request(app)
      .get("/protected");

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Insufficient permissions",
    });
  });

  it("allows an authorized role", async () => {
    const app = createTestApp("MANAGER");

    const response = await request(app)
      .get("/protected");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Access granted",
    });
  });

  it("allows another configured role", async () => {
    const app = createTestApp(
      "ORGANIZATION_ADMIN",
    );

    const response = await request(app)
      .get("/protected");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Access granted",
    });
  });

  it("does not allow an unknown role", async () => {
    const app = createTestApp(
      "UNKNOWN_ROLE",
    );

    const response = await request(app)
      .get("/protected");

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Insufficient permissions",
    });
  });
});