import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";

import { env } from "../../src/config/env.js";
import { authenticate } from "../../src/middlewares/authenticate.middleware.js";

function createTestApp() {
  const app = express();

  app.get(
    "/protected",
    authenticate,
    (req, res) => {
      res.status(200).json({
        success: true,
        user: req.user,
      });
    },
  );

  return app;
}

function createAccessToken(
  overrides: Partial<{
    sub: string;
    organizationId: number;
    role: string;
    type: "ORG_ACCESS" | "PLATFORM_ADMIN";
  }> = {},
): string {
  return jwt.sign(
    {
      sub: "1",
      organizationId: 10,
      role: "CUSTOMER",
      type: "ORG_ACCESS",
      ...overrides,
    },
    env.jwt.accessSecret,
    {
      expiresIn: "30m",
    },
  );
}

describe("authenticate middleware", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const response = await request(createTestApp())
      .get("/protected");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("returns 401 when Authorization scheme is not Bearer", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", "Basic abc123");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid authorization header",
    });
  });

  it("returns 401 when Bearer token is missing", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", "Bearer");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid authorization header",
    });
  });

  it("returns 401 when access token is invalid", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set(
        "Authorization",
        "Bearer invalid-token",
      );

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired access token",
    });
  });

  it("returns 401 when token has the wrong type", async () => {
    const token = createAccessToken({
      type: "PLATFORM_ADMIN",
    });

    const response = await request(createTestApp())
      .get("/protected")
      .set(
        "Authorization",
        `Bearer ${token}`,
      );

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid access token",
    });
  });

  it("returns 401 when access token is expired", async () => {
    const token = jwt.sign(
      {
        sub: "1",
        organizationId: 10,
        role: "CUSTOMER",
        type: "ORG_ACCESS",
      },
      env.jwt.accessSecret,
      {
        expiresIn: -1,
      },
    );

    const response = await request(createTestApp())
      .get("/protected")
      .set(
        "Authorization",
        `Bearer ${token}`,
      );

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired access token",
    });
  });

  it("accepts a valid organization access token", async () => {
    const token = createAccessToken();

    const response = await request(createTestApp())
      .get("/protected")
      .set(
        "Authorization",
        `Bearer ${token}`,
      );

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      user: {
        id: 1,
        organizationId: 10,
        role: "CUSTOMER",
      },
    });
  });
});