import request from "supertest";
import app from "../src/app.js";

describe("404 Not Found", () => {
  it("should return a standardized not found response", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Route not found: GET /api/v1/does-not-exist",
      code: "NOT_FOUND",
    });
  });
});