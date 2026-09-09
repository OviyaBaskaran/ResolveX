import fs from "node:fs/promises";
import path from "node:path";
import pool from "../config/database.js";

const migrationsDirectory = path.resolve(process.cwd(), "migrations");

const runMigrations = async (): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    // 1. Create the migration tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get migrations that have already been executed
    const [rows] = await connection.query(
      "SELECT migration FROM schema_migrations ORDER BY migration"
    );

    const executedMigrations = new Set(
      (rows as { migration: string }[]).map((row) => row.migration)
    );

    // 3. Read all SQL migration files
    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // 4. Execute pending migrations
    for (const file of files) {
      if (executedMigrations.has(file)) {
        continue;
      }

      const filePath = path.join(migrationsDirectory, file);
      const sql = await fs.readFile(filePath, "utf8");

      console.log(`Applying migration: ${file}`);

      await connection.beginTransaction();

      try {
        await connection.query(sql);

        await connection.query(
          "INSERT INTO schema_migrations (migration) VALUES (?)",
          [file]
        );

        await connection.commit();

        console.log(`Migration completed: ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log("All migrations completed successfully.");
  } finally {
    connection.release();
    await pool.end();
  }
};

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});