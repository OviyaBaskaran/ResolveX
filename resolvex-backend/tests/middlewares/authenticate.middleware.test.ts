import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../../src/app.js";
import { env } from "../../src/config/env.js";

describe("Organization authentication middleware", () => {
  function createAccessToken(
    overrides: Partial<{
      sub: string;
      organizationId: number;
      role: string;
      type: string;
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

  it("returns 401 when Authorization header is missing", async () => {
    const response = await request(app)
      .get("/api/v1/test/protected");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("returns 401 when Authorization header is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/test/protected")
      .set("Authorization", "Basic abc123");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid authorization header",
    });
  });

  it("returns 401 when access token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/test/protected")
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

    const response = await request(app)
      .get("/api/v1/test/protected")
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

  it("returns 401 when token is expired", async () => {
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

    const response = await request(app)
      .get("/api/v1/test/protected")
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

    const response = await request(app)
      .get("/api/v1/test/protected")
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