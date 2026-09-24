import request from "supertest";
import app from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("should return a successful health response", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "ResolveX API is running",
    });
  });
});