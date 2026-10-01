import fs from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2";
import pool from "../config/database.js";

const migrationsDir = path.resolve(process.cwd(), "migrations");

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      migration VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      PRIMARY KEY (id),

      UNIQUE KEY uq_schema_migrations_migration (migration)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);
}

async function runMigrations(): Promise<void> {
  // 1. Make sure the migration tracking table exists
  await ensureMigrationsTable();

  // 2. Get migrations that have already been applied
  const [rows] = await pool.query<
    (RowDataPacket & { migration: string })[]
  >(`
    SELECT migration
    FROM schema_migrations
    ORDER BY id ASC
  `);

  const appliedMigrations = new Set(
    rows.map((row) => row.migration),
  );

  // 3. Read migration files
  const files = await fs.readdir(migrationsDir);

  // 4. Keep only migration files and sort them by filename
  const migrationFiles = files
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  // 5. Run pending migrations
  for (const file of migrationFiles) {
    if (appliedMigrations.has(file)) {
      console.log(`Already applied: ${file}`);
      continue;
    }

    console.log(`Running migration: ${file}`);

    const filePath = path.join(migrationsDir, file);

    // 6. Read SQL file
    const sql = await fs.readFile(filePath, "utf8");

    // 7. Execute migration
    await pool.query(sql);

    // 8. Record successful migration
    await pool.query(
      `
        INSERT INTO schema_migrations (migration)
        VALUES (?)
      `,
      [file],
    );

    console.log(`Applied: ${file}`);
  }

  console.log("Database migrations completed successfully.");
}

runMigrations()
  .catch((error: unknown) => {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });