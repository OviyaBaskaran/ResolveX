import request from "supertest";
import express from "express";
import { z } from "zod";
import { validateBody } from "../src/middlewares/validation.middleware.js";
import { errorMiddleware } from "../src/middlewares/error.middleware.js";

const app = express();

app.use(express.json());

const testSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

app.post(
  "/test-validation",
  validateBody(testSchema),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Validation passed",
    });
  },
);

app.use(errorMiddleware);

describe("Validation middleware", () => {
  it("should reject invalid request body", async () => {
    const response = await request(app)
      .post("/test-validation")
      .send({
        email: "invalid-email",
        password: "123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.code).toBe("VALIDATION_ERROR");

    expect(response.body.errors).toHaveProperty("email");
    expect(response.body.errors).toHaveProperty("password");
  });

  it("should allow valid request body", async () => {
    const response = await request(app)
      .post("/test-validation")
      .send({
        email: "user@example.com",
        password: "password123",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Validation passed",
    });
  });
});