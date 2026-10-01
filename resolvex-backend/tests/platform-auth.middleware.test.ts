import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

import { env } from "../src/config/env.js";
import { platformAuthMiddleware } from "../src/middlewares/platform-auth.middleware.js";

function createTestApp() {
  const app = express();

  app.get(
    "/protected",
    platformAuthMiddleware,
    (req, res) => {
      res.status(200).json({
        success: true,
        platformAdminId: req.platformAdminId,
      });
    },
  );

  return app;
}

describe("Platform Authentication Middleware", () => {
  const app = createTestApp();

  describe("Authorization header", () => {
    it("should reject a request without an authorization header", async () => {
      const response = await request(app)
        .get("/protected");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Authentication required",
      });
    });

    it("should reject an invalid authorization header", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Basic abc123");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid authorization header",
      });
    });

    it("should reject a Bearer header without a token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid authorization header",
      });
    });
  });

  describe("Access token", () => {
    it("should reject an invalid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid or expired access token",
      });
    });

    it("should reject a token with the wrong token type", async () => {
      const token = jwt.sign(
        {
          sub: "1",
          type: "ORGANIZATION_USER",
        },
        env.jwt.accessSecret,
        {
          expiresIn: "30m",
        },
      );

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid or expired access token",
      });
    });

    it("should allow a valid platform access token", async () => {
      const token = jwt.sign(
        {
          sub: "1",
          type: "PLATFORM_ADMIN",
        },
        env.jwt.accessSecret,
        {
          expiresIn: "30m",
        },
      );

      const response = await request(app)
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        platformAdminId: 1,
      });
    });
  });
});