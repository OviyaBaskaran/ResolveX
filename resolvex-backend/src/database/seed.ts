import bcrypt from "bcrypt";
import pool from "../config/database.js";
import { env } from "../config/env.js";

async function seedPlatformAdmin(): Promise<void> {
  const name = env.platformAdmin.name;
  const email = env.platformAdmin.email;
  const password = env.platformAdmin.password;

  const [existingRows] = await pool.query(
    `
      SELECT id
      FROM platform_admins
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  const existingAdmin = existingRows as Array<{ id: number }>;

  if (existingAdmin.length > 0) {
    console.log(`Platform admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `
      INSERT INTO platform_admins (
        name,
        email,
        password_hash,
        status
      )
      VALUES (?, ?, ?, 'ACTIVE')
    `,
    [name, email, passwordHash],
  );

  console.log(`Platform admin created successfully: ${email}`);
}

seedPlatformAdmin()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });