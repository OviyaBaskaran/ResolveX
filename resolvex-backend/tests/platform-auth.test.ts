import request from "supertest";

import app from "../src/app.js";
import { env } from "../src/config/env.js";


describe("Platform Admin Authentication", () => {
  const validCredentials = {
    email: env.platformAdmin.email,
    password: env.platformAdmin.password,
  };

  describe("POST /api/v1/platform/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/v1/platform/auth/login")
        .send(validCredentials);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe(
        "Platform admin login successful",
      );

      expect(response.body.data.accessToken).toEqual(
        expect.any(String),
      );

      expect(response.body.data.admin).toEqual({
        id: expect.any(Number),
        name: env.platformAdmin.name,
        email: env.platformAdmin.email,
      });
    });

    it("should reject an incorrect password", async () => {
      const response = await request(app)
        .post("/api/v1/platform/auth/login")
        .send({
          email: validCredentials.email,
          password: "DefinitelyWrongPassword@999",
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should reject an unknown email", async () => {
      const response = await request(app)
        .post("/api/v1/platform/auth/login")
        .send({
          email: "unknown-platform-admin@invalid.test",
          password: validCredentials.password,
        });

      expect(response.status).toBe(401);

      expect(response.body).toEqual({
        success: false,
        message: "Invalid email or password",
      });
    });

    it("should reject an invalid request body", async () => {
      const response = await request(app)
        .post("/api/v1/platform/auth/login")
        .send({
          email: "invalid-email",
          password: "",
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);

      expect(response.body.message).toBe(
        "Validation failed",
      );

      expect(response.body.errors).toEqual(
        expect.any(Array),
      );
    });
  });
  

});