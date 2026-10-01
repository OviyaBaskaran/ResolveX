import pool from "../src/config/database.js";

afterAll(async () => {
  await pool.end();
});